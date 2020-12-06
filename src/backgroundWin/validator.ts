import { invalidField, validationAttemptResult, validationResult } from './../types';
import validator from "validator";
import { promises as fs } from 'fs';

const typeCheckers = {
  array: (i: unknown) => Array.isArray(i),
  uuid: (i: unknown) => typeof i === "string" && validator.isUUID(i),
  timestamp: (i: unknown) => typeof i === "string" && validator.isISO8601(i),
  string: (i: unknown) => typeof i === "string",
  object: (i: unknown) =>
    i !== null && !Array.isArray(i) && typeof i === "object",
  null: (i: unknown) => i === null,
  lengthCheck: (i: string | unknown[], length: number, operator: string) => {
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
  number: (i: unknown) => typeof i === "number",
  boolean: (i: unknown) => i === true || i === false
};

function determineType(i: unknown) {
  const type = "Unknown";
  const potentials = Object.keys(typeCheckers).filter(i => i !== "lengthCheck" && i !== 'string');
  for (let n = 0; n < potentials.length; n += 1) {
    try {
      const res = typeCheckers[potentials[n]](i);
      if (res) {
        return potentials[n];
      }
    }
    catch (e) {
      continue;
    }
  }
  if (type === 'Unknown' && typeof i === 'string') return 'string'
  return type;
}

function allPropertiesExist(obj: object, template: object, originalKey: string) {
  console.log('key', originalKey, 'template', template, 'obj', obj)
  const missingFields: invalidField[] = []
  if (!obj && !originalKey.includes('?')) {
    return [{
      key: originalKey,
      reason: 'Non-optional key is missing'
    }]
  }
  if (typeof obj === 'string') {
    return []
  }
  if (Array.isArray(template) && Array.isArray(obj) && obj.length === 0) {
    return []
  }
  Object.keys(template).forEach(key => {
    const isOptional = key.includes('?')
    const exists = Object.hasOwnProperty.call(obj, key)
    if (!exists && !isOptional) {
      missingFields.push({
        key: originalKey ? originalKey + '.' + key : key,
        reason: 'Non-optional key is missing'
      })
    }
  })
  return missingFields
}

function recurseThroughObject(
  obj: object | unknown[],
  template: object | unknown[]
) {
  const invalidFields: invalidField[] = [];
  if (Array.isArray(obj)) {
    let desiredType = template[0];
    if (typeof desiredType === "string") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obj.forEach((item: any, index: number) => {
        // const fieldValidations = recurseThroughObject(item, template[0]);
        // fieldValidations.forEach(i => {
        //   const trueKey = index + "." + i.key;
        //   invalidFields.push({
        //     key: trueKey,
        //     reason: i.reason
        //   });
        // });
        if (!typeCheckers[desiredType](item)) {
          invalidFields.push({
            key: `${index}`,
            reason:
              "Expected " + desiredType + " but received " + determineType(item)
          });
        }
      });
    }
    else {
      desiredType = determineType(template[0])
      if (desiredType === 'Unknown') {
        invalidFields.push({
          key: '',
          reason: "Could not determine desired type for this key in your template. Does your template contain an empty array or object? Always-empty arrays or objects are not valid types."
        })
      }
      obj.forEach((item: any, index: number) => {
        // Only fully validate the first object in arrays
        if ((desiredType === 'object' || desiredType === 'array') && index === 0) {
          const fieldValidations = recurseThroughObject(item, template[0]);
          fieldValidations.forEach(i => {
            const trueKey = index + "." + i.key;
            invalidFields.push({
              key: trueKey,
              reason: i.reason
            });
          });
        }
        else if (!typeCheckers[desiredType](item)) {
          invalidFields.push({
            key: `${index}`,
            reason:
              "Expected " + desiredType + " but received " + determineType(item)
          });
        }
      });
    }
  }
  else if (typeCheckers.object(obj)) {
    Object.keys(obj).forEach(key => {
      let expectedValue = template[key];
      const receivedValue = obj[key];
      const isOptional = Object.hasOwnProperty.call(template, key + "?");
      if (isOptional && !expectedValue) {
        expectedValue = template[key + "?"];
      }
      const isPresentButIsFalsy =
        !receivedValue && Object.hasOwnProperty.call(template, key);
      // const isPresentInTemplateButFalsy = !expectedValue && Object.hasOwnProperty.call(template, key);
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
                const length = singleType.split(operator)[1];
                valid = typeCheckers.lengthCheck(
                  receivedValue,
                  Number(length),
                  operator
                );
              }
              else {
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
      }
      else if (receivedValue && !expectedValue && !isOptional) {
        invalidFields.push({
          key,
          reason: "Unexpected property"
        });
      }
    });
  }
  const res = allPropertiesExist(obj, template, '')
  res.forEach(i => invalidFields.push(i))
  return invalidFields;
}

function checkObject(
  obj: object,
  template: object | object[]
): validationResult {
  const invalidFields: invalidField[] = [];

  if (!obj) {
    return {
      valid: false,
      invalidFields: [{
        key: '',
        reason: 'Attempted to validate an object, but the item received was falsy'
      }]
    };
  }
  if (Array.isArray(obj)) {
    if (!Array.isArray(template) || !template.length) {
      return {
        valid: false,
        invalidFields: [{
          key: '',
          reason: 'Received an array, but the template is not an array'
        }]
      };
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
  }
  else if (typeof obj === "object") {
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

async function validate(
  endpoint: string,
  body: object,
  type: 'request' | 'response',
  method: string,
  pathToValidation: string,
  fullEndpointIncludingVariables: string
): Promise<validationAttemptResult> {
  if (pathToValidation) {
    try {
      const template = __non_webpack_require__(
        pathToValidation + endpoint + ".js"
      );
      return { couldBeValidated: true, result: checkObject(body, template[type][method][fullEndpointIncludingVariables]) };
    }
    catch (e) {
      console.log(e);
    }
  }

  return { couldBeValidated: false };
}

function createValidationTemplate(body: object): object | string[] | object[] | null {
  if (typeCheckers.object(body)) {
    const template = {};
    Object.keys(body).forEach(key => {
      const current = body[key];
      if (typeCheckers.object(current) || typeCheckers.array(current)) {
        template[key] = createValidationTemplate(current);
      }
      else {
        template[key] = determineType(current);
      }
    });
    return template;
  }
  else if (Array.isArray(body)) {
    if (body.length) {
      if (typeof body[0] === "object") {
        return [createValidationTemplate(body[0])];
      }
      return [determineType(body[0])];
    }
    return []
  }
  return null
}

async function saveValidationTemplate(
  endpoint: string,
  method: string,
  requestTemplate: string,
  responseTemplate: string,
  pathToValidation: string,
): Promise<boolean> {
  try {
    const rootEndpoint = `/${endpoint.split('/')[1]}`
    const endpointWithoutSlash = rootEndpoint.replace('/', '')
    let existingObject = {
      request: {
        [method]: {}
      },
      response: {
        [method]: {}
      }
    }
    try {
      const template = __non_webpack_require__(
        pathToValidation + endpointWithoutSlash + ".js"
      );
      if (template) {
        existingObject = template
        if (!existingObject.request) {
          existingObject.request = {
            [method]: {}
          }
        }
        else if (!existingObject.request[method]) {
          existingObject.request[method] = {}
        }
        if (!existingObject.response) {
          existingObject.response = {
            [method]: {}
          }
        }
        else if (!existingObject.response[method]) {
          existingObject.response[method] = {}
        }
      }
    }
    catch (err) {
      console.log(err)
      existingObject = {
        request: {
          [method]: {}
        },
        response: {
          [method]: {}
        }
      }
    }
    if (method !== 'GET' && method !== 'DELETE') {
      existingObject.request[method][endpoint] = JSON.parse(requestTemplate)
    }
    else {
      existingObject.request[method][endpoint] = `${method} requests should not have JSON bodies and are therefore ignored`
    }
    existingObject.response[method][endpoint] = JSON.parse(responseTemplate)
    const wholeObjectAsFormattedString = 'module.exports = ' + JSON.stringify(existingObject, null, 4)
    await fs.writeFile(pathToValidation + endpointWithoutSlash + '.js', wholeObjectAsFormattedString)
    return true
  }
  catch (e) {
    console.log(e)
    return false
  }
}

export { validate, createValidationTemplate, saveValidationTemplate };

// TODOs
// * add user-defined functions to templates
// // * Handle different routes on the same endpoint e.g. /employees/:id and also params e.g. ?all=true
// * What about recursive objects? Currently not supported
// // * If get, ignore request body
// // * Handle large arrays - check first index, then just check the rest for types?
// // * The frontend UI cannot handle rendering a massive array, even if you don't validate the whole thing
// // * Frontend in general should delete requests from the stack when they get over a certain amount
// // * Write readme and caveat document

// * Create settings menu for performance limitations
// Current performance limitations:
// Only 100 requests kept in memory in frontend
// Only first item in array is parsed
// Max string length of 4000 for JSON responses being displayed

// // * App should remember your target url and path
// // Add this in local storage

// // * Bug: Expected string & length > 10 but received string
// // Fix bug

// Remembers local storage
// Bug fixes: Handling empty arrays properly, strings with length params
// Added option to mass-create endpoint templates
// Endpoints can now have differing paths, such as /employees or /employees/:uuid
