import validator from "validator";

type invalidField = {
  key: string;
  reason: string;
};

interface validationResult {
  valid: boolean;
  invalidFields?: Array<invalidField>;
}

const typeCheckers = {
  array: (i: any) => Array.isArray(i),
  uuid: (i: any) => typeof i === "string" && validator.isUUID(i),
  timestamp: (i: any) => typeof i === "string" && validator.isISO8601(i),
  string: (i: any) => typeof i === "string",
  object: (i: any) => i !== null && !Array.isArray(i) && typeof i === "object",
  null: (i: any) => i === null,
  undefined: (i: any) => i === undefined,
  lengthCheck: (i: string | any[], length: number, operator: string) => {
    switch (operator) {
      case "<":
        return i.length < length;
      case ">":
        return i.length > length;
      case "<=":
        return i.length <= length;
      case ">=":
        return i.length >= length;
      case "=":
        return i.length === length;
      default:
        return false;
    }
  },
  mimetype: (i: string) => validator.isMimeType(i),
  locale: (i: string) => validator.isLocale(i),
  jwt: (i: string) => validator.isJWT(i),
  email: (i: string) => validator.isEmail(i),
  number: (i: any) => typeof i === "number",
  boolean: (i: any) => i === true || i === false
};

function determineType(i: any) {
  let type = "Unknown";
  const potentials = Object.keys(typeCheckers).filter(i => i !== "lengthCheck");
  for (let n = 0; n < potentials.length; n += 1) {
    try {
      const res = typeCheckers[potentials[n]](i);
      if (res) {
        return potentials[n];
      }
    } catch (e) {
      continue;
    }
  }
  return type;
}

// if array
// determine first type inside array in template
// check that each member of the array conforms with that

function recurseThroughObject(obj: object | any[], template: object | any[]) {
  const invalidFields: invalidField[] = [];
  if (Array.isArray(obj)) {
    const desiredType = template[0];
    if (typeof desiredType !== "string") {
      obj.forEach((item: any, index: number) => {
        const fieldValidations = recurseThroughObject(item, template[0]);
        fieldValidations.forEach(i => {
          const trueKey = index + "." + i.key;
          invalidFields.push({
            key: trueKey,
            reason: i.reason
          });
        });
      });
    } else {
      obj.forEach((item: any, index: number) => {
        if (!typeCheckers[desiredType](item)) {
          invalidFields.push({
            key: `${index}`,
            reason:
              "Expected " + desiredType + " but received " + determineType(item)
          });
        }
      });
    }
  } else if (typeCheckers.object(obj)) {
    Object.keys(obj).forEach(key => {
      let expectedValue = template[key];
      const receivedValue = obj[key];
      const isOptional = template.hasOwnProperty(key + "?");
      if (isOptional && !expectedValue) {
        expectedValue = template[key + "?"];
      }
      const isPresentButIsFalsy =
        !receivedValue && template.hasOwnProperty(key);
      if (expectedValue && (receivedValue || isPresentButIsFalsy)) {
        // If array, we need to check the data inside the array
        if (
          typeCheckers.array(receivedValue) &&
          typeCheckers.array(expectedValue)
        ) {
          const fieldValidations = recurseThroughObject(
            receivedValue,
            expectedValue
          );
          fieldValidations.forEach(i => {
            const trueKey = key + "." + i.key;
            invalidFields.push({
              key: trueKey,
              reason: i.reason
            });
          });
        }

        // If object, we need to check the data inside the object
        else if (
          typeCheckers.object(receivedValue) &&
          typeCheckers.object(expectedValue)
        ) {
          const fieldValidations = recurseThroughObject(
            receivedValue,
            expectedValue
          );
          fieldValidations.forEach(i => {
            const trueKey = key + "." + i.key;
            invalidFields.push({
              key: trueKey,
              reason: i.reason
            });
          });
        }

        // Primitive values
        else {
          const acceptableTypes = expectedValue.split("|");
          let atLeastOneValid = false;

          // Type checking the property
          for (let i = 0; i < acceptableTypes.length; i += 1) {
            if (atLeastOneValid) {
              break;
            }
            const type = acceptableTypes[i];
            const mustHaves = type.split("&");
            let valid = true;
            for (let j = 0; j < mustHaves.length; j += 1) {
              const singleType = mustHaves[j];
              if (singleType.includes("length")) {
                const operator = singleType[6];
                const length = singleType.split(operator)[2];
                valid = typeCheckers.lengthCheck(
                  receivedValue,
                  Number(length),
                  operator
                );
              } else {
                valid = typeCheckers[singleType](receivedValue);
              }
              if (!valid) {
                break;
              }
            }
            if (valid) {
              atLeastOneValid = true;
            }
          }

          if (!atLeastOneValid) {
            invalidFields.push({
              key,
              reason:
                "Expected " +
                expectedValue +
                " but received " +
                determineType(receivedValue)
            });
          }
        }
      } else if (!receivedValue && !isOptional) {
        invalidFields.push({
          key,
          reason: "Property missing"
        });
      } else if (receivedValue && !expectedValue && !isOptional) {
        invalidFields.push({
          key,
          reason: "Unexpected property"
        });
      }
    });
  }
  return invalidFields;
}

function checkObject(
  obj: object,
  template: object | object[]
): validationResult {
  const invalidFields: invalidField[] = [];

  if (!obj) {
    throw new Error("Not an object");
  }
  if (Array.isArray(obj)) {
    if (!Array.isArray(template) || !template.length) {
      throw new Error("Received array but template is not array");
    }
    obj.forEach((i, index) => {
      const results = recurseThroughObject(i, template[0]);
      results.forEach(item => {
        invalidFields.push({
          key: index + "." + item.key,
          reason: item.reason
        });
      });
    });
  } else if (typeof obj === "object") {
    const results = recurseThroughObject(obj, template);
    results.forEach(i => {
      invalidFields.push(i);
    });
  }

  return {
    valid: invalidFields.length === 0,
    invalidFields
  };
}

async function validateRequest(
  endpoint: string,
  body: object,
  headers: object,
  method: string,
  pathToValidation: string
): Promise<object> {
  let template = null;
  if (pathToValidation) {
    try {
      template = await import(pathToValidation + endpoint + ".js");
      return checkObject(body, template.request);
    } catch (e) {
      console.log(e);
    }
  }

  return {};
}

function createValidationTemplate(body: object): any {
  if (typeCheckers.object(body)) {
    let template = {};
    Object.keys(body).forEach(key => {
      const current = body[key];
      if (typeCheckers.object(current) || typeCheckers.array(current)) {
        template[key] = createValidationTemplate(current);
      } else {
        template[key] = determineType(current);
      }
    });
    return template;
  } else if (Array.isArray(body)) {
    if (body.length) {
      if (typeof body[0] === "object") {
        return [createValidationTemplate(body[0])];
      }
      return [determineType(body[0])];
    }
  }
}

async function run() {
  console.time("asd");
  const res = await validateRequest(
    "asd",
    [
      {
        id: "cfbed6d9-b7af-43ae-aa9f-30c8a0370165",
        start: "2020-04-30T18:00:00.000Z",
        end: "2020-05-29T18:00:00.000Z",
        title: "1.0",
        description: null,
        budgetedHours: 200,
        project: "28b63787-b5b5-4348-bbf9-08f2bde60453",
        parent: "18ee0222-ddc0-4879-931c-e4017fc7f72d",
        dependsOn: null,
        slotTemplate: {
          employees: {
            generic: {
              "3": {
                amount: 1,
                start: "05:00",
                end: "18:00",
                breaks: [
                  {
                    start: "09:30",
                    end: "09:30"
                  }
                ],
                asd: [0]
              }
            }
          },
          resources: {}
        }
      }
    ],
    {},
    "POST",
    "/home/cooper/Documents/ecu project/prototype/exampleValidations/"
  );
  console.timeEnd("asd");
  console.log(res);
}

run();
const res = createValidationTemplate({
  id: "cfbed6d9-b7af-43ae-aa9f-30c8a0370165",
  start: "2020-04-30T18:00:00.000Z",
  end: "2020-05-29T18:00:00.000Z",
  title: "1.0",
  description: null,
  budgetedHours: 200,
  project: "28b63787-b5b5-4348-bbf9-08f2bde60453",
  parent: "18ee0222-ddc0-4879-931c-e4017fc7f72d",
  dependsOn: null,
  slotTemplate: {
    employees: {
      generic: {
        "3": {
          amount: 1,
          start: "05:00",
          end: "18:00",
          breaks: [
            {
              start: "09:30",
              end: "09:30"
            }
          ],
          asd: [0]
        }
      }
    },
    resources: {}
  }
});
if (res && res.slotTemplate) {
  console.log(res.slotTemplate.employees.generic["3"]);
}
