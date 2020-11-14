<template>
  <v-dialog v-model="show" width="800px">
    <v-card width="800">
      <v-card-title>
        Generate validation for new endpoint
      </v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12">
            <v-stepper class="elevation-0" v-model="step" vertical>
              <v-stepper-step :complete="step > 1" step="1">
                Enter details
              </v-stepper-step>
              <v-stepper-content :step="1">
                <v-col cols="12">
                  <v-text-field
                    v-model="endpointName"
                    required
                    :rules="[v => !!v]"
                    label="Endpoint name"
                    placeholder="e.g. /users"
                  >
                  </v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="method"
                    :items="methodOptions"
                    label="Method"
                  />
                </v-col>
                <v-col cols="12">
                  <v-btn
                    color="primary"
                    :disabled="!validEndpointNameAndMethod"
                    @click.stop="record"
                    block
                    :loading="recording"
                  >
                    Record
                  </v-btn>
                </v-col>
              </v-stepper-content>
              <v-stepper-step :complete="step > 2" step="2">
                Review request template
              </v-stepper-step>
              <v-stepper-content :step="2">
                <v-col cols="6">
                  <v-subheader>
                    Generated request template:
                  </v-subheader>
                </v-col>
                <v-spacer />
                <v-col cols="2">
                  <v-select :items="['basic', 'as json']" label="Edit" v-model="editMode" @change="viewConverted">
                  </v-select>
                </v-col>
                <v-col cols="12">
                  <v-card-text v-if="editMode === 'basic'" class="cardTextClass">
                    <div v-for="(line, index) in modifiableRequestTypings" :key="index">
                      <p v-if="!line.type">
                        <span>{{ line.display }}</span>
                      </p>
                      <p v-else>
                        <span>{{ line.display }}</span>
                        <span style="max-width: 150px; display: inline-flex; height: 10px;">
                          <v-select dense outlined v-if="line.type !== 'object' && line.type !== 'array'" v-model="line.type" :items="typeOptions"></v-select>
                          <v-select dense outlined v-else disabled :value="line.type" :items="['object', 'array']">
                            <template v-slot:append>
                              <div></div>
                            </template>
                          </v-select>
                        </span>
                        <span> {{ line.displayAfter }}</span>
                        <span style="display: inline-flex">
                          <v-checkbox dense v-model="line.optional" label="Optional?" />
                        </span>
                      </p>
                    </div>
                  </v-card-text>
                  <v-card-text v-else class="cardTextClass">
                    <v-textarea v-model="JSONRequestString" />
                  </v-card-text>
                </v-col>
                <v-col cols="12">
                  <v-btn block color="primary" @click.stop="step += 1">
                    Next
                  </v-btn>
                </v-col>
              </v-stepper-content>
              <v-stepper-step :complete="step > 3" step="3">
                Review request template
              </v-stepper-step>
              <v-stepper-content :step="3">
                <v-col cols="12">
                  <v-subheader>
                    Generated response template:
                  </v-subheader>
                  <v-card-text class="cardTextClass">
                    <div v-for="(line, index) in modifiableResponseTypings" :key="index">
                      <p v-if="!line.type">
                        <span>{{ line.display }}</span>
                      </p>
                      <p v-else>
                        <span>{{ line.display }}</span>
                        <span style="max-width: 150px; display: inline-flex; height: 10px;">
                          <v-select dense outlined v-if="line.type !== 'object' && line.type !== 'array'" v-model="line.type" :items="typeOptions"></v-select>
                          <v-select dense outlined v-else disabled :value="line.type" :items="['object', 'array']">
                            <template v-slot:append>
                              <div></div>
                            </template>
                          </v-select>
                        </span>
                        <span> {{ line.displayAfter }}</span>
                        <span style="display: inline-flex">
                          <v-checkbox dense v-model="line.optional" label="Optional?" />
                        </span>
                      </p>
                    </div>
                  </v-card-text>
                </v-col>
              </v-stepper-content>
            </v-stepper>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { IPCHandler } from "../IPCHandler";
import { Getter } from "vuex-class";
import { ConversionResult, LineDescription, RecordingResult } from "@/types";

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
    this.handler.send("record-endpoint", {
      endpoint: this.endpointName,
      method: this.method,
    });
  }

  handleSuccessfulRecording(data: RecordingResult) {
    console.log("data", data, event);
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
      this.responseResult = data.responseTemplate;
      this.recording = false;
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

  removeWhitespaceNotInKey(input: string): string {
    const firstQuote = input.indexOf('"');
    const secondQuote = input.indexOf('"', firstQuote + 1);
    const savedKey = input.substring(firstQuote + 1, secondQuote);
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
    const fieldName = splitByColon[0] + ": ";
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
        actualType = "Unknown";
        break;
    }
    return {
      display: fieldName,
      type: actualType,
      displayAfter,
      optional: false,
    };
  }

  viewConverted() {
    if (this.step === 2) {
      const converted = this.convertBackToObject(this.modifiableRequestTypings);
      this.JSONRequestString = converted.asString;
    }
    else if (this.step === 3) {
      const converted = this.convertBackToObject(
        this.modifiableResponseTypings
      );
      this.JSONResponseString = converted.asString;
    }
  }

  // TODO these functions need to also make sure the user is following the request template structure (e.g. the types are within the valid type options)
  get JSONRequestStringInvalid() {
    let valid = false;
    try {
      JSON.parse(this.JSONRequestString);
      valid = true;
    }
    catch (e) {
      return valid;
    }
    return valid;
  }

  get JSONResponseStringInvalid() {
    let valid = false;
    try {
      JSON.parse(this.JSONResponseString);
      valid = true;
    }
    catch (e) {
      return valid;
    }
    return valid;
  }

  convertBackToObject(input: LineDescription[]): ConversionResult {
    let returnItem = "";
    input.forEach((item) => {
      if (item.type) {
        let addString = this.removeWhitespaceNotInKey(item.display);
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
</style>
