<template>
  <v-dialog persistent v-model="show" width="800px">
    <vue-announcer />
    <v-card color="black" role="dialog" width="800">
      <v-card-title aria-label="Dialog heading" role="heading" tabindex="0" >
        Generate validation for new endpoint
        <v-spacer />
        <v-icon @click.stop="show = false" role="button" aria-label="Close recorder dialog">mdi-close</v-icon>
      </v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12">
            <v-stepper class="elevation-0 black" v-model="step" vertical>
              <v-stepper-step :complete="step > 1" step="1">
                <span :tabindex="step === 1 ? 0 : null">Enter details</span>
              </v-stepper-step>
              <v-stepper-content :step="1">
                <v-col v-if="step === 1" cols="12">
                  <v-text-field
                    v-model="endpointName"
                    required
                    :rules="[v => !!v]"
                    label="Endpoint name"
                    placeholder="e.g. /users"
                  >
                  </v-text-field>
                </v-col>
                <v-col v-if="step === 1" cols="12">
                  <v-autocomplete
                    v-model="method"
                    eager
                    :items="methodOptions"
                    label="Method"
                  />
                </v-col>
                <v-col v-if="step === 1" cols="12">
                  <v-btn
                    color="primary"
                    :disabled="!validEndpointNameAndMethod"
                    :aria-disabled="!validEndpointNameAndMethod"
                    @click.stop="record"
                    block
                    outlined
                    :loading="recording"
                  >
                    Record
                  </v-btn>
                </v-col>
              </v-stepper-content>
              <v-stepper-step :complete="step > 2" step="2">
                <span style="cursor: pointer" aria-label="Step 2" @click="step = 2" @keydown.space="step = 2" :tabindex="step === 2 ? 0 : null">Review request template</span>
              </v-stepper-step>
              <v-stepper-content :step="2">
                <v-row v-if="step === 2" dense>
                  <v-col cols="6">
                    <v-subheader tabindex="0">
                      Generated request template:
                    </v-subheader>
                  </v-col>
                  <v-spacer />
                  <v-col cols="1">
                    <v-icon v-if="editMode === 'as json'" aria-label="Formatting help" class="pt-4" @click.stop="showFormattingHelp = true">mdi-help-circle</v-icon>
                  </v-col>
                  <v-col cols="3">
                    <v-autocomplete :items="['basic', 'as json']" label="Edit" v-model="editMode" @change="viewConverted" :disabled="!JSONRequestStringValid">
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="12">
                    <v-card-text v-if="editMode === 'basic'" class="cardTextClass">
                      <div v-for="(line, index) in modifiableRequestTypings" :key="index">
                        <p v-if="!line.type">
                          <span>{{ line.display }}</span>
                        </p>
                        <p v-else>
                          <span tabindex="0">{{ line.display }}</span>
                          <span :tabindex="typeOptions.includes(line.type) ? null : 0" style="display: inline-flex; height: 20px;">
                            <v-autocomplete aria-label="Type" style="max-width: 150px; " dense outlined v-if="typeOptions.includes(line.type)" v-model="line.type" :items="typeOptions"></v-autocomplete>
                            <div v-else class="customTypeClass">{{ line.type }}</div>
                          </span>
                          <span style="display: inline-flex">
                            <v-checkbox dense v-model="line.optional" label="Optional?" />
                          </span>
                          <span> {{ line.displayAfter }}</span>
                        </p>
                      </div>
                    </v-card-text>
                    <v-card-text v-else >
                      <v-textarea role="textbox" aria-label="Edit your JSON here" v-model="JSONRequestString" auto-grow :rules="[v => JSONRequestStringValid]" :style="(JSONRequestStringValid ? 'background-color:  rgba(17, 123, 17, 0.426)' : 'background-color: rgba(184, 16, 16, 0.419)') + '; '"/>
                    </v-card-text>
                  </v-col>
                  <v-col cols="12">
                    <v-btn outlined :disabled="!JSONRequestStringValid" block color="primary" @click.stop="step += 1">
                      Next
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-content>
              <v-stepper-step :complete="step > 3" step="3">
                <span aria-label="Step 2" :tabindex="step === 3 ? 0 : null">Review response template</span>
              </v-stepper-step>
              <v-stepper-content :step="3">
              <v-row v-if="step === 3"  dense>
                  <v-col cols="6">
                    <v-subheader tabindex="0">
                      Generated response template:
                    </v-subheader>
                  </v-col>
                  <v-spacer />
                  <v-col cols="1">
                    <v-icon v-if="editMode === 'as json'" aria-label="Formatting help" class="pt-4" @click.stop="showFormattingHelp = true">mdi-help-circle</v-icon>
                  </v-col>
                  <v-col cols="3">
                    <v-autocomplete :items="['basic', 'as json']" label="Edit" v-model="editMode" @change="viewConverted" :disabled="!JSONResponseStringValid">
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="12">
                    <v-card-text v-if="editMode === 'basic'" class="cardTextClass">
                      <div v-for="(line, index) in modifiableResponseTypings" :key="index">
                        <p v-if="!line.type">
                          <span>{{ line.display }}</span>
                        </p>
                        <p v-else>
                          <span tabindex="0">{{ line.display }}</span>
                          <span :tabindex="typeOptions.includes(line.type) ? null : 0" style="display: inline-flex; height: 20px;">
                            <v-autocomplete aria-label="Type" style="max-width: 150px; " dense outlined v-if="typeOptions.includes(line.type)" v-model="line.type" :items="typeOptions"></v-autocomplete>
                            <div v-else class="customTypeClass">{{ line.type }}</div>
                          </span>
                          <span style="display: inline-flex">
                            <v-checkbox dense v-model="line.optional" label="Optional?" />
                          </span>
                          <span> {{ line.displayAfter }}</span>
                        </p>
                      </div>
                    </v-card-text>
                    <v-card-text v-else >
                      <v-textarea role="textbox" aria-label="Edit your JSON here"  v-model="JSONResponseString" auto-grow :rules="[v => JSONResponseStringValid]" :style="(JSONResponseStringValid ? 'background-color:  rgba(17, 123, 17, 0.426)' : 'background-color: rgba(184, 16, 16, 0.419)') + '; '"/>
                    </v-card-text>
                  </v-col>
                  <v-col cols="12">
                    <v-btn outlined :disabled="!JSONResponseStringValid" block color="primary" @click.stop="save">
                      Save
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-content>
            </v-stepper>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-dialog v-if="showFormattingHelp" v-model="showFormattingHelp" width="600">
      <v-card role="dialog" width="600">
        <v-card-title tabindex="0">
          Formatting help
        </v-card-title>
        <v-card-text>
          <v-row dense class="text-left">
            <v-col tabindex="0" cols="12">
              The following denotes the formatting required when editing your validation template as JSON.
            </v-col>
            <v-col tabindex="0" cols="12">
              <ul>
                <li>Template must be valid JSON.</li>
                <li>Key names cannot inherently contain question marks or colons. Adding a question mark to the end of a key denotes that it is optional, i.e. it may be undefined or not present on the object at all.</li>
                <li>When denoting a type, the following are valid:
                  <ul>
                    <li v-for="(type, index) in typeOptions" :key="index">
                      <code>{{ type }}</code>
                    </li>
                  </ul>
                </li>
                <li>UUIDs are expected to be v4 UUIDs.</li>
                <li>For non-primitive types (objects and arrays), instead of denoting the type with a string as above (e.g. <code>"id": "uuid"</code>) you should denote the type literally, i.e. if id is an object it would be <code>"id": { (..your object here) ..}</code></li>
                <li>Arrays must contain something that indicates what the array should contain. If the array is to contain a primitive type, for instance if it is an array of numbers, you can write an array containing the string containing that type: <code>"ids": ["number"]</code>. If the array is to contain non-primitive types, then as above, denote those directly. For example: <code>"myObjectArray": [{ "id": uuid", "name": "string" }]</code></li>
                <li>You may combine multiple primitive types using the | operator. For instance, if <code>employeeID</code> can be either a uuid or a number, you could write: <code>"employeeID": "uuid|number"</code></li>
                <li>Strings can have a length property to indicate the desired length of the string. See the following examples:
                  <ul>
                    <li>String with length more than 0: <code>string&length>0</code></li>
                    <li>String with length less than 10: <code>{{ 'string&length<10' }}</code></li>
                    <li>String with length more than or equal to 10: <code>string&length>=10</code></li>
                    <li>String with length less than or equal to 10: <code>string&length<=10</code></li>
                    <li>String with length exactly 4: <code>string&length=4</code></li>
                  </ul>
                </li>
              </ul>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn outlined block color="primary" @click.stop="showFormattingHelp = false" aria-label="exit help dialog">
            Got it!
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { IPCHandler } from "../IPCHandler";
import { Getter } from "vuex-class";
import { ConversionResult, LineDescription, RecordingResult, SaveTemplateResult } from "@/types";

@Component
export default class Recorder extends Vue {
  @Prop() readonly value!: boolean;
  @Getter("handler") handler!: IPCHandler;

  endpointName = "";
  method = "";
  methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  typeOptions = [
    "uuid",
    "timestamp",
    "string",
    "null",
    "mimetype",
    "locale",
    "jwt",
    "email",
    "number",
    "boolean",
  ];

  recording = false;
  showFormattingHelp = false;
  step = 1;
  editMode = "basic";
  JSONRequestString = "";
  JSONResponseString = "";

  requestResult: object | string[] | object[] | null = null;
  modifiableRequestTypings: LineDescription[] = [];
  responseResult: object | string[] | object[] | null = null;
  modifiableResponseTypings: LineDescription[] = [];

  mounted() {
    this.handler.on("recording", this.handleSuccessfulRecording);
    this.handler.on("save-validation", this.handleSaveEvent);
    interface KeyboardEvent {
      keyCode: number;
      ctrlKey: boolean;
    }
    const KeyPress = (e: KeyboardEvent) => {
      // eslint-disable-next-line no-restricted-globals
      const evtobj = e
      if (evtobj.keyCode === 72 && evtobj.ctrlKey) {
        this.showFormattingHelp = true
      }
    }

    document.onkeydown = KeyPress
  }

  beforeDestroy() {
    this.handler.off("recording", this.handleSuccessfulRecording);
    this.handler.off("save-validation", this.handleSaveEvent);
  }

  get validEndpointNameAndMethod() {
    return (
      this.endpointName &&
      /\/[A-Z|a-z]/g.test(this.endpointName) &&
      !!this.method
    );
  }

  get show() {
    return this.value;
  }

  set show(val: boolean) {
    this.$emit("input", val);
  }

  record() {
    this.recording = true;
    this.$announcer.set(`Listening. Please send a ${this.method} request to ${this.endpointName}`)
    this.handler.send("record-endpoint", {
      endpoint: this.endpointName,
      method: this.method,
    });
  }

  handleSuccessfulRecording(data: RecordingResult) {
    this.requestResult = data.requestTemplate;
    if (typeof data.requestTemplate === "object" && data.requestTemplate) {
      this.modifiableRequestTypings = this.getLinesForDisplay(
        data.requestTemplate
      );
    }
    if (typeof data.responseTemplate === "object" && data.responseTemplate) {
      this.modifiableResponseTypings = this.getLinesForDisplay(
        data.responseTemplate
      );
    }
    if (
      this.modifiableResponseTypings.length &&
      this.modifiableRequestTypings.length
    ) {
      const converted = this.convertBackToObject(this.modifiableRequestTypings);
      const responseConverted = this.convertBackToObject(this.modifiableResponseTypings);
      this.JSONRequestString = converted.asString;
      this.JSONResponseString = responseConverted.asString;
      this.responseResult = data.responseTemplate;
      this.recording = false;
      this.$announcer.set('Request received. Please edit your validation template for the request & response')
      this.step = 2;
    }
  }

  beautify(input: object): string {
    return JSON.stringify(input, null, 4);
  }

  getLinesForDisplay(input: object | object[]): LineDescription[] {
    const beautified = this.beautify(input);
    const split = beautified.split("\n");
    const typesParsed = split.map((i) => {
      return this.parseOutType(i);
    });
    return typesParsed;
  }

  removeWhitespaceNotInKey(input: string, optional: boolean): string {
    const firstQuote = input.indexOf('"');
    const secondQuote = input.indexOf('"', firstQuote + 1);
    let savedKey = input.substring(firstQuote + 1, secondQuote);
    if (optional && savedKey.indexOf("?") !== savedKey.length - 1) {
      savedKey = savedKey + "?";
    }
    const noWhiteSpace = input.replace(/ /g, "");
    const firstQuoteInNoWhiteSpace = noWhiteSpace.indexOf('"');
    const secondQuoteInNoWhiteSpace = noWhiteSpace.indexOf(
      '"',
      firstQuoteInNoWhiteSpace + 1
    );
    const modifiedKey = noWhiteSpace.substring(
      firstQuoteInNoWhiteSpace + 1,
      secondQuoteInNoWhiteSpace
    );
    return noWhiteSpace.split(modifiedKey).join(savedKey);
  }

  parseOutType(s: string): LineDescription {
    const splitByColon = s.split(":");
    if (splitByColon.length < 2) {
      const noWhiteSpace = s.replace(/ /g, "").replace(/,/g, "");
      if (["{", "}", "[", "]"].includes(noWhiteSpace)) {
        // Line is just for display purposes
        return {
          display: s,
          optional: false,
        };
      }
      else {
        // Type of thing inside array when not object, e.g. "number"
        return {
          display: s,
          type: s.replace(/"/g, "").replace(/ /g, "").replace(/,/g, ""),
          optional: false,
        };
      }
    }
    let fieldName = splitByColon[0] + ": ";
    let optional = false;
    if (splitByColon[0].indexOf("?") === splitByColon[0].length - 2) {
      optional = true;
      fieldName = fieldName.replace('?"', '"');
    }
    let displayAfter = ",";
    const type = splitByColon[1]
      .replace(/"/g, "")
      .replace(/ /g, "")
      .replace(/,/g, "");
    let actualType = "";
    switch (type) {
      case "[":
        actualType = "array";
        displayAfter = "[";
        break;
      case "[]":
        actualType = "array";
        displayAfter = "[],";
        break;
      case "uuid":
        actualType = "uuid";
        break;
      case "timestamp":
        actualType = "timestamp";
        break;
      case "string":
        actualType = "string";
        break;
      case "null":
        actualType = "null";
        break;
      case "mimetype":
        actualType = "mimetype";
        break;
      case "{":
        actualType = "object";
        displayAfter = "{";
        break;
      case "{}":
        actualType = "object";
        displayAfter = "{},";
        break;
      case "locale":
        actualType = "locale";
        break;
      case "jwt":
        actualType = "jwt";
        break;
      case "email":
        actualType = "email";
        break;
      case "number":
        actualType = "number";
        break;
      case "boolean":
        actualType = "boolean";
        break;
      default:
        actualType = type;
        break;
    }
    return {
      display: fieldName,
      type: actualType,
      displayAfter,
      optional,
    };
  }

  validateType(input: string): boolean {
    console.log(input, 'input')
    try {
      const allowedTypes = [...this.typeOptions, 'array', 'object']
      const operators = ['<', '>', '=']
      const longOperators = ['>=', '<=']
      if (allowedTypes.includes(input)) {
        return true
      }
      const splitByOr = input.split('|')
      for (let i = 0; i < splitByOr.length; i += 1) {
        const current = splitByOr[i]
        if (allowedTypes.includes(current)) {
          continue
        }
        if (!current.includes('string&length')) {
          console.log('fail 1')
          return false
        }
        if (current.indexOf('string&length') === 0 && current.length > 13) {
          if (longOperators.includes(current.substring(13, 15))) {
            const num = current.substring(15, current.length)
            if (!isNaN(Number(num)) && Number(num) > 0) {
              continue
            }
          }
          else if (operators.includes(current[13])) {
            const num = current.substring(14, current.length)
            if (!isNaN(Number(num)) && Number(num) > 0) {
              continue
            }
          }
        }
        console.log('fail 2')
        return false
      }
      return true
    }
    catch (e) {
      console.error(e)
      return false
    }
  }

  get JSONRequestStringValid() {
    let valid = false;
    try {
      const object = JSON.parse(this.JSONRequestString);
      const lineByLine = this.getLinesForDisplay(object)
      for (let i = 0; i < lineByLine.length; i += 1) {
        const line = lineByLine[i]
        if (line.type) {
          const validType = this.validateType(line.type)
          if (!validType) {
            return false
          }
        }
      }
      valid = true;
    }
    catch (e) {
      return valid;
    }
    return valid;
  }

  @Watch('JSONRequestStringValid')
  onJSONRequestStringValidChange(val: boolean) {
    if (!val) {
      this.$announcer.set('Your JSON is invalid. Press ctrl+h to view the formatting help')
    }
    else {
      this.$announcer.set('JSON valid')
    }
  }

  get JSONResponseStringValid() {
    let valid = false;
    try {
      const object = JSON.parse(this.JSONResponseString);
      const lineByLine = this.getLinesForDisplay(object)
      for (let i = 0; i < lineByLine.length; i += 1) {
        const line = lineByLine[i]
        if (line.type) {
          const validType = this.validateType(line.type)
          if (!validType) {
            return false
          }
        }
      }
      valid = true;
    }
    catch (e) {
      return valid;
    }
    return valid;
  }

  viewConverted(e: 'as json'|'basic') {
    if (e === 'basic') {
      // Convert JSON back to basic
      this.convertRequestStringToArray()
      this.convertResponseStringToArray()
    }
    else {
      // Convert basic to json
      this.convertRequestArrayToString()
      this.convertResponseArrayToString()
    }
  }

  convertRequestStringToArray() {
    const object = JSON.parse(this.JSONRequestString)
    this.modifiableRequestTypings = this.getLinesForDisplay(object)
  }

  convertRequestArrayToString() {
    const converted = this.convertBackToObject(this.modifiableRequestTypings);
    this.JSONRequestString = converted.asString;
    this.modifiableRequestTypings = this.getLinesForDisplay(
      converted.asObject
    );
  }

  convertResponseStringToArray() {
    const object = JSON.parse(this.JSONResponseString)
    this.modifiableResponseTypings = this.getLinesForDisplay(object)
  }

  convertResponseArrayToString() {
    const converted = this.convertBackToObject(
      this.modifiableResponseTypings
    );
    this.JSONResponseString = converted.asString;
    this.modifiableResponseTypings = this.getLinesForDisplay(
      converted.asObject
    );
  }

  @Watch('JSONResponseStringValid')
  onJSONResponseStringValidChange(val: boolean) {
    if (!val) {
      this.$announcer.set('Your JSON is invalid. Press ctrl+h to view the formatting help')
    }
    else {
      this.$announcer.set('JSON valid')
    }
  }

  async save() {
    if (this.editMode === 'basic') {
      this.viewConverted('as json')
    }
    else {
      this.viewConverted('basic')
    }
    await this.handler.send('save-validation', {
      endpoint: this.endpointName,
      method: this.method,
      requestTemplate: this.JSONRequestString,
      responseTemplate: this.JSONResponseString
    })
  }

  handleSaveEvent(e: SaveTemplateResult) {
    if (e.success) {
      this.$emit('announcement', 'Validation template saved. Dialog closed')
      this.show = false
    }
    else {
      this.$emit('announcement', 'Validation template could not be saved. Dialog closed')
      this.show = false
    }
  }

  convertBackToObject(input: LineDescription[]): ConversionResult {
    let returnItem = "";
    input.forEach((item) => {
      if (item.type) {
        let addString = this.removeWhitespaceNotInKey(
          item.display,
          item.optional
        );
        addString += `${
          ["object", "array"].includes(item.type) ? `` : `"${item.type}"`
        }${item.displayAfter}`;
        returnItem += addString;
      }
      else {
        returnItem += item.display.replace(/ /g, "");
      }
    });
    let unnecessaryCommasRemoved = "";
    for (let i = 0; i < returnItem.length; i += 1) {
      if (returnItem[i] === "," && returnItem[i + 1] !== '"') {
        continue;
      }
      unnecessaryCommasRemoved += returnItem[i];
    }
    const parsed = JSON.parse(unnecessaryCommasRemoved);
    unnecessaryCommasRemoved = this.beautify(parsed);
    return {
      asObject: parsed,
      asString: unnecessaryCommasRemoved,
    };
  }
}
</script>

<style scoped>
.cardTextClass {
  font-size: 14pt;
  height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
  text-align: left;
  background-color: black;
}
p {
  margin-bottom: 0px;
}
.customTypeClass {
  margin: 8px;
  border: 1px solid grey;
  border-radius: 5px;
  padding: 8px;
  color: grey;
  height: fit-content;
}
h1 {
  color: rgba(184, 16, 16, 0.419)

}
</style>
