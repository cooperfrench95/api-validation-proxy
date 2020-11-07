"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var validator_1 = require("validator");
var typeCheckers = {
    array: function (i) { return Array.isArray(i); },
    uuid: function (i) { return typeof i === "string" && validator_1["default"].isUUID(i); },
    timestamp: function (i) { return typeof i === "string" && validator_1["default"].isISO8601(i); },
    string: function (i) { return typeof i === "string"; },
    object: function (i) { return i !== null && !Array.isArray(i) && typeof i === "object"; },
    "null": function (i) { return i === null; },
    undefined: function (i) { return i === undefined; },
    lengthCheck: function (i, length, operator) {
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
    mimetype: function (i) { return validator_1["default"].isMimeType(i); },
    locale: function (i) { return validator_1["default"].isLocale(i); },
    jwt: function (i) { return validator_1["default"].isJWT(i); },
    email: function (i) { return validator_1["default"].isEmail(i); },
    number: function (i) { return typeof i === "number"; },
    boolean: function (i) { return i === true || i === false; }
};
function determineType(i) {
    var type = "Unknown";
    var potentials = Object.keys(typeCheckers).filter(function (i) { return i !== "lengthCheck"; });
    for (var n = 0; n < potentials.length; n += 1) {
        try {
            var res_1 = typeCheckers[potentials[n]](i);
            if (res_1) {
                return potentials[n];
            }
        }
        catch (e) {
            continue;
        }
    }
    return type;
}
// if array
// determine first type inside array in template
// check that each member of the array conforms with that
function recurseThroughObject(obj, template) {
    var invalidFields = [];
    if (Array.isArray(obj)) {
        var desiredType_1 = template[0];
        if (typeof desiredType_1 !== "string") {
            obj.forEach(function (item, index) {
                var fieldValidations = recurseThroughObject(item, template[0]);
                fieldValidations.forEach(function (i) {
                    var trueKey = index + "." + i.key;
                    invalidFields.push({
                        key: trueKey,
                        reason: i.reason
                    });
                });
            });
        }
        else {
            obj.forEach(function (item, index) {
                if (!typeCheckers[desiredType_1](item)) {
                    invalidFields.push({
                        key: "" + index,
                        reason: "Expected " + desiredType_1 + " but received " + determineType(item)
                    });
                }
            });
        }
    }
    else if (typeCheckers.object(obj)) {
        Object.keys(obj).forEach(function (key) {
            var expectedValue = template[key];
            var receivedValue = obj[key];
            var isOptional = template.hasOwnProperty(key + "?");
            if (isOptional && !expectedValue) {
                expectedValue = template[key + "?"];
            }
            var isPresentButIsFalsy = !receivedValue && template.hasOwnProperty(key);
            if (expectedValue && (receivedValue || isPresentButIsFalsy)) {
                // If array, we need to check the data inside the array
                if (typeCheckers.array(receivedValue) &&
                    typeCheckers.array(expectedValue)) {
                    var fieldValidations = recurseThroughObject(receivedValue, expectedValue);
                    fieldValidations.forEach(function (i) {
                        var trueKey = key + "." + i.key;
                        invalidFields.push({
                            key: trueKey,
                            reason: i.reason
                        });
                    });
                }
                // If object, we need to check the data inside the object
                else if (typeCheckers.object(receivedValue) &&
                    typeCheckers.object(expectedValue)) {
                    var fieldValidations = recurseThroughObject(receivedValue, expectedValue);
                    fieldValidations.forEach(function (i) {
                        var trueKey = key + "." + i.key;
                        invalidFields.push({
                            key: trueKey,
                            reason: i.reason
                        });
                    });
                }
                // Primitive values
                else {
                    var acceptableTypes = expectedValue.split("|");
                    var atLeastOneValid = false;
                    // Type checking the property
                    for (var i = 0; i < acceptableTypes.length; i += 1) {
                        if (atLeastOneValid) {
                            break;
                        }
                        var type = acceptableTypes[i];
                        var mustHaves = type.split("&");
                        var valid = true;
                        for (var j = 0; j < mustHaves.length; j += 1) {
                            var singleType = mustHaves[j];
                            if (singleType.includes("length")) {
                                var operator = singleType[6];
                                var length_1 = singleType.split(operator)[2];
                                valid = typeCheckers.lengthCheck(receivedValue, Number(length_1), operator);
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
                            key: key,
                            reason: "Expected " +
                                expectedValue +
                                " but received " +
                                determineType(receivedValue)
                        });
                    }
                }
            }
            else if (!receivedValue && !isOptional) {
                invalidFields.push({
                    key: key,
                    reason: "Property missing"
                });
            }
            else if (receivedValue && !expectedValue && !isOptional) {
                invalidFields.push({
                    key: key,
                    reason: "Unexpected property"
                });
            }
        });
    }
    return invalidFields;
}
function checkObject(obj, template) {
    var valid = true;
    var invalidFields = [];
    if (!obj) {
        throw new Error("Not an object");
    }
    if (Array.isArray(obj)) {
        if (!Array.isArray(template) || !template.length) {
            throw new Error("Received array but template is not array");
        }
        obj.forEach(function (i, index) {
            var results = recurseThroughObject(i, template[0]);
            results.forEach(function (item) {
                invalidFields.push({
                    key: index + "." + item.key,
                    reason: item.reason
                });
            });
        });
    }
    else if (typeof obj === "object") {
        var results = recurseThroughObject(obj, template);
        results.forEach(function (i) {
            invalidFields.push(i);
        });
    }
    return {
        valid: invalidFields.length === 0,
        invalidFields: invalidFields
    };
}
function validateRequest(endpoint, body, headers, method, pathToValidation) {
    return __awaiter(this, void 0, void 0, function () {
        var template, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    template = null;
                    if (!pathToValidation) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require(pathToValidation + endpoint + ".js"); })];
                case 2:
                    template = _a.sent();
                    return [2 /*return*/, checkObject(body, template.request)];
                case 3:
                    e_1 = _a.sent();
                    console.log(e_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, {}];
            }
        });
    });
}
function createValidationTemplate(body) {
    if (typeCheckers.object(body)) {
        var template_1 = {};
        Object.keys(body).forEach(function (key) {
            var current = body[key];
            if (typeCheckers.object(current) || typeCheckers.array(current)) {
                template_1[key] = createValidationTemplate(current);
            }
            else {
                template_1[key] = determineType(current);
            }
        });
        return template_1;
    }
    else if (Array.isArray(body)) {
        if (body.length) {
            if (typeof body[0] === "object") {
                return [createValidationTemplate(body[0])];
            }
            return [determineType(body[0])];
        }
    }
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.time("asd");
                    return [4 /*yield*/, validateRequest("asd", [
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
                        ], {}, "POST", "/home/cooper/Documents/ecu project/prototype/exampleValidations/")];
                case 1:
                    res = _a.sent();
                    console.timeEnd("asd");
                    console.log(res);
                    return [2 /*return*/];
            }
        });
    });
}
run();
var res = createValidationTemplate({
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
