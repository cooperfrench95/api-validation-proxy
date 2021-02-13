<template>
  <v-dialog persistent v-model="show" width="800px">
    <vue-announcer />
    <v-card  role="dialog" width="800">
      <v-card-title aria-label="Dialog heading" role="heading" tabindex="0" >
        {{ $t('Generate validation for new endpoint(s)') }}
        <v-spacer />
        <v-icon @click.stop="show = false" role="button" aria-label="Close recorder dialog">mdi-close</v-icon>
      </v-card-title>
      <v-card-text>
        <v-row v-if="!hasChosenMode" dense>
          <v-col cols="12">
            <v-subheader class="text-left">
              {{ $t('Would you like to generate a template for a single endpoint, or automatically generate templates for multiple endpoints?') }}
            </v-subheader>
            <v-subheader class="text-left red--text">
              {{ $t('WARNING: Choosing multiple endpoint mode could cause some of your existing templates to be overriden. Proceed with caution.') }}
            </v-subheader>
          </v-col>
          <v-col cols="12">
            <v-btn outlined block @click.stop="singleEndpointMode = true; hasChosenMode = true" color="primary">{{ $t('Single') }}</v-btn>
          </v-col>
          <v-col cols="12">
            <v-btn outlined block @click.stop="recordAll" color="red">
              {{ $t('Multiple') }}
            </v-btn>
          </v-col>
        </v-row>
        <v-row dense v-else>
          <v-col v-if="singleEndpointMode" cols="12">
            <v-stepper class="elevation-0 black" v-model="step" vertical>
              <v-stepper-step :complete="step > 1" step="1">
                <span :tabindex="step === 1 ? 0 : null">{{ $t('Enter details') }}</span>
              </v-stepper-step>
              <v-stepper-content :step="1">
                <v-col v-if="step === 1" cols="12">
                  <v-text-field
                    v-model="endpointName"
                    required
                    :rules="[v => !!v]"
                    :label="$t('Endpoint name')"
                    :placeholder="$t('Define variable path params with :type. (e.g. /users/:uuid/user-groups/:number)')"
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
                    {{ $t('Record') }}
                  </v-btn>
                </v-col>
              </v-stepper-content>
              <v-stepper-step :complete="step > 2" step="2">
                <span style="cursor: pointer" aria-label="Step 2" @click="step = 2" @keydown.space="step = 2" :tabindex="step === 2 ? 0 : null">{{ $t('Review request template') }}</span>
              </v-stepper-step>
              <v-stepper-content :step="2">
                <v-row v-if="step === 2 && method !== 'GET' && method !== 'DELETE'" dense>
                  <v-col cols="6">
                    <v-subheader tabindex="0">
                      {{ $t('Generated request template:') }}
                    </v-subheader>
                  </v-col>
                  <v-spacer />
                  <v-col cols="1">
                    <v-icon v-if="editMode === 'as json'" aria-label="Formatting help" class="pt-4" @click.stop="showFormattingHelp = true">mdi-help-circle</v-icon>
                  </v-col>
                  <v-col cols="3">
                    <v-autocomplete :items="['basic', 'as json']" label="Edit" v-model="editMode" @change="viewConverted" :disabled="!JSONRequestStringValid">
                      <template slot="selection" slot-scope="data">
                        {{ $t(data.item) }}
                      </template>
                      <template slot="item" slot-scope="data">
                        {{ $t(data.item) }}
                      </template>
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
                      {{ $t('Next') }}
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row v-else-if="step === 2" >
                  <v-col cols="12">
                    <v-subheader tabindex="0">
                      {{ $t('No request body for this method. Click next.') }}
                    </v-subheader>
                  </v-col>
                  <v-col cols="12">
                    <v-btn outlined block color="primary" @click.stop="step += 1">
                      {{ $t('Next') }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-content>
              <v-stepper-step :complete="step > 3" step="3">
                <span aria-label="Step 2" :tabindex="step === 3 ? 0 : null">{{ $t('Review response template') }}</span>
              </v-stepper-step>
              <v-stepper-content :step="3">
              <v-row v-if="step === 3" dense>
                  <v-col cols="6">
                    <v-subheader tabindex="0">
                      {{ $t('Generated response template:') }}
                    </v-subheader>
                  </v-col>
                  <v-spacer />
                  <v-col cols="1">
                    <v-icon v-if="editMode === 'as json'" aria-label="Formatting help" class="pt-4" @click.stop="showFormattingHelp = true">mdi-help-circle</v-icon>
                  </v-col>
                  <v-col cols="3">
                    <v-autocomplete :items="['basic', 'as json']" label="Edit" v-model="editMode" @change="viewConverted" :disabled="!JSONResponseStringValid">
                      <template slot="selection" slot-scope="data">
                        {{ $t(data.item) }}
                      </template>
                      <template slot="item" slot-scope="data">
                        {{ $t(data.item) }}
                      </template>
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
                      {{ $t('Save') }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-stepper-content>
            </v-stepper>
          </v-col>
          <v-col v-else cols="12">
            <v-row dense>
              <v-col cols="2">
                <v-progress-circular class="mt-3" indeterminate />
              </v-col>
              <v-col cols="10" class="text-left">
                {{ $t("Listening. Send as many requests to as many endpoints as you can, but make sure they're valid! Your templates will be generated based on the requests and responses. Requests that return a status code of >399 will be ignored.") }}
              </v-col>
              <v-col cols="12" class="pb-0 mb-0">
                <v-text-field class="pt-2" single-line v-model="searchString" append-icon="mdi-close" @click:append="searchString = ''" label="Search"/>
              </v-col>
              <v-col cols="12" class="pt-0 mt-0">
                <v-simple-table height="400">
                  <thead>
                    <tr>
                      <th style="cursor: pointer" @click.stop="selectAll">{{ $t('Save') }}</th>
                      <th>{{ $t('Endpoint') }}</th>
                      <th>{{ $t('Method') }}</th>
                      <th>{{ $t('View details') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="text-left" v-for="(request, index) in filteredResponsesBulkMode" :key="index">
                      <td>
                        <v-checkbox v-model="request.shouldSave" />
                      </td>
                      <td>
                        {{ request.endpoint }}
                      </td>
                      <td>
                        {{ request.method }}
                      </td>
                      <td>
                        <v-btn outlined color="primary" @click.stop="viewDetailsForRequest(request)">
                          <v-icon>mdi-eye</v-icon>
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </v-col>
              <v-col cols="6" class="text-left">
                <v-btn outlined @click.stop="receivedRequestsForBulkMode = []; show = false">
                  {{ $t('Cancel') }}
                </v-btn>
              </v-col>
              <v-col class="text-right" cols="6">
                <v-btn color="primary" outlined :disabled="totalSelectedBulkMode === 0" @click.stop="save">
                  ({{ totalSelectedBulkMode }} {{ $t('Selected) Save')}}
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <formatting-help :show="showFormattingHelp" @close="showFormattingHelp = false" />
    <v-dialog v-if="viewingDetails" :value="true" width="600">
      <v-card width="600">
        <v-card-title>
          {{ ('Request details') }}
          <v-spacer />
          <v-icon @click.stop="viewingDetails = null">mdi-close</v-icon>
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
              <div style="display: flex; font-size: 12pt" class="pa-2">
                <span style="flex-grow: 1" class="text-left">
                  {{ viewingDetails.method.toUpperCase() }} - {{ viewingDetails.endpoint }}
                </span>
                <span
                  class="text--right pr-3"
                  :style="
                    `flex-grow: 0; font-weight: 1000; color: green`"
                >
                  {{ viewingDetails.response.statusCode }}
                </span>
              </div>
            </v-col>
            <v-expansion-panels accordion flat :style="`border: 1px solid white`">
              <v-expansion-panel>
                <v-expansion-panel-header >
                  <v-col cols="12">
                    {{ $t('Request') }}
                  </v-col>
                </v-expansion-panel-header>
                <v-expansion-panel-content >
                  <v-col cols="12">
                    <v-simple-table height="300" width="400">
                      <thead>
                        <tr>
                          <th>{{ $t('Header') }}</th>
                          <th>{{ $t('Value') }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="text-left" v-for="(h, k) in viewingDetails.request.headers" :key="k">
                          <td valign="top">{{ k }}</td>
                          <td style="max-width: 200px;">{{ h }}</td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                    <p class="cardTextClass">
                      {{ beautify(viewingDetails.request.data, $t, JSONDisplayLimit, true) }}
                    </p>
                  </v-col>
                </v-expansion-panel-content>
              </v-expansion-panel>
              <v-expansion-panel>
                <v-expansion-panel-header >
                  <v-col cols="12">
                    {{ $t('Response') }}
                  </v-col>
                </v-expansion-panel-header>
                <v-expansion-panel-content >
                  <v-col cols="12">
                    <v-simple-table height="300" width="400">
                      <thead>
                        <tr>
                          <th>{{ $t('Header') }}</th>
                          <th>{{ $t('Value') }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="text-left" v-for="(h, k) in viewingDetails.response.headers" :key="k">
                          <td valign="top">{{ k }}</td>
                          <td style="max-width: 200px;">{{ h }}</td>
                        </tr>
                      </tbody>
                    </v-simple-table>
                    <p class="cardTextClass">
                      {{ beautify(viewingDetails.response.data, $t, JSONDisplayLimit, true) }}
                    </p>
                  </v-col>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { IPCHandler } from "../IPCHandler";
import { Getter } from "vuex-class";
import { LineDescription, RecordingResult, SaveTemplateResult, IPCHandlerResponse } from "@/types";
import FormattingHelp from './FormattingHelp.vue';
import { typeOptions, parseOutType, validateType, convertBackToObject, beautify, getLinesForDisplay } from './functions';

@Component({
  components: {
    FormattingHelp
  },
})
export default class Recorder extends Vue {
  @Prop() readonly value!: boolean;
  @Prop() readonly JSONDisplayLimit!: number;
  @Getter("handler") handler!: IPCHandler;

  endpointName = "";
  method = "";
  methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  readonly typeOptions = typeOptions

  recording = false;
  showFormattingHelp = false;
  singleEndpointMode = true;
  hasChosenMode = false;
  step = 1;
  editMode = "basic";
  JSONRequestString = "";
  JSONResponseString = "";
  viewingDetails: RecordingResult|null = null;
  searchString = "";
  receivedRequestsForBulkMode: RecordingResult[] = [];
  // eslint-disable-next-line @typescript-eslint/ban-types
  requestResult: object | string[] | object[] | null = null;
  modifiableRequestTypings: LineDescription[] = [];
  // eslint-disable-next-line @typescript-eslint/ban-types
  responseResult: object | string[] | object[] | null = null;
  modifiableResponseTypings: LineDescription[] = [];
  parseOutType = parseOutType;
  validateType = validateType;
  convertBackToObject = convertBackToObject;
  getLinesForDisplay = getLinesForDisplay;
  beautify = beautify;

  mounted(): void {
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

  beforeDestroy(): void {
    this.handler.off("recording", this.handleSuccessfulRecording);
    this.handler.off("save-validation", this.handleSaveEvent);
  }

  get filteredResponsesBulkMode(): RecordingResult[] {
    if (!this.searchString) return this.receivedRequestsForBulkMode
    return this.receivedRequestsForBulkMode.filter(i => i.endpoint.includes(this.searchString))
  }

  get totalSelectedBulkMode(): number {
    return this.receivedRequestsForBulkMode.filter(i => i.shouldSave).length
  }

  selectAll(): void {
    if (this.receivedRequestsForBulkMode.length) {
      const selectedAlready = this.receivedRequestsForBulkMode[0].shouldSave
      const newArray = this.receivedRequestsForBulkMode.map(i => {
        i.shouldSave = !selectedAlready
        return i
      })
      this.receivedRequestsForBulkMode = newArray
    }
  }

  get validEndpointNameAndMethod(): boolean {
    return (
      !!this.endpointName &&
      /\/[A-Z|a-z]/g.test(this.endpointName) &&
      !!this.method
    );
  }

  get show(): boolean {
    return this.value;
  }

  set show(val: boolean) {
    this.$emit("input", val);
  }

  record(): void {
    this.recording = true;
    this.$announcer.set(`${this.$t('Listening. Please send a ')}${this.method}${this.$t(' request to ')}${this.endpointName}`)
    this.handler.send("record-endpoint", {
      endpoint: this.endpointName,
      method: this.method,
    });
  }

  recordAll(): void {
    this.singleEndpointMode = false
    this.hasChosenMode = true
    this.recording = true;
    this.handler.send("record-all-endpoints", {});
  }

  handleSuccessfulRecording(data: RecordingResult): void {
    if (this.singleEndpointMode) {
      this.requestResult = data.requestTemplate;
      const ignoreRequestPortion = (this.method === 'GET' || this.method === 'DELETE')
      if (typeof data.requestTemplate === "object" && data.requestTemplate) {
        this.modifiableRequestTypings = this.getLinesForDisplay(
          data.requestTemplate,
          this.$t
        );
      }
      if (typeof data.responseTemplate === "object" && data.responseTemplate) {
        this.modifiableResponseTypings = this.getLinesForDisplay(
          data.responseTemplate,
          this.$t
        );
      }
      if (
        this.modifiableResponseTypings.length &&
        (this.modifiableRequestTypings.length || ignoreRequestPortion)
      ) {
        if (!ignoreRequestPortion) {
          const converted = this.convertBackToObject(this.modifiableRequestTypings, this.$t);
          this.JSONRequestString = converted.asString;
        }
        const responseConverted = this.convertBackToObject(this.modifiableResponseTypings, this.$t);
        this.JSONResponseString = responseConverted.asString;
        this.responseResult = data.responseTemplate;
        this.recording = false;
        this.$announcer.set(`${this.$t('Request received. Please edit your validation template for the request & response')}`)
        this.step = 2;
      }
    }
    else if (data && data.response &&
      this.receivedRequestsForBulkMode.findIndex(i => i.endpoint === data.endpoint && i.method === data.method) === -1
    ) {
      this.receivedRequestsForBulkMode.push(data)
    }
  }

  viewDetailsForRequest(request: RecordingResult): void {
    this.viewingDetails = request
  }

  get JSONRequestStringValid(): boolean {
    let valid = false;
    try {
      const object = JSON.parse(this.JSONRequestString);
      const lineByLine = this.getLinesForDisplay(object, this.$t)
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
  onJSONRequestStringValidChange(val: boolean): void {
    if (!val) {
      this.$announcer.set(`${this.$t('Your JSON is invalid. Press ctrl+h to view the formatting help')}`)
    }
    else {
      this.$announcer.set(`${this.$t('JSON valid')}`)
    }
  }

  get JSONResponseStringValid(): boolean {
    let valid = false;
    try {
      const object = JSON.parse(this.JSONResponseString);
      const lineByLine = this.getLinesForDisplay(object, this.$t)
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

  viewConverted(e: 'as json'|'basic'): void {
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

  convertRequestStringToArray(): void {
    const ignoreRequestPortion = (this.method === 'GET' || this.method === 'DELETE')
    if (!ignoreRequestPortion) {
      const object = JSON.parse(this.JSONRequestString)
      this.modifiableRequestTypings = this.getLinesForDisplay(object, this.$t)
    }
  }

  convertRequestArrayToString(): void {
    if (!(this.method === 'GET' || this.method === 'DELETE')) {
      const converted = this.convertBackToObject(this.modifiableRequestTypings, this.$t);
      this.JSONRequestString = converted.asString;
      this.modifiableRequestTypings = this.getLinesForDisplay(
        converted.asObject,
        this.$t
      );
    }
  }

  convertResponseStringToArray(): void {
    const object = JSON.parse(this.JSONResponseString)
    this.modifiableResponseTypings = this.getLinesForDisplay(object, this.$t)
  }

  convertResponseArrayToString(): void {
    const converted = this.convertBackToObject(
      this.modifiableResponseTypings,
      this.$t
    );
    this.JSONResponseString = converted.asString;
    this.modifiableResponseTypings = this.getLinesForDisplay(
      converted.asObject,
      this.$t
    );
  }

  @Watch('JSONResponseStringValid')
  onJSONResponseStringValidChange(val: boolean): void {
    if (!val) {
      this.$announcer.set(`${this.$t('Your JSON is invalid. Press ctrl+h to view the formatting help')}`)
    }
    else {
      this.$announcer.set(`${this.$t('JSON valid')}`)
    }
  }

  async save(): Promise<void> {
    if (this.singleEndpointMode === false) {
      const promises: Promise<IPCHandlerResponse<string|Record<string, unknown>>>[] = []
      this.receivedRequestsForBulkMode.forEach(i => {
        if (i.shouldSave) {
          let requestTemplate = '{}'
          if (i.method !== 'GET' && i.method !== 'DELETE') {
            requestTemplate = JSON.stringify(i.requestTemplate)
          }
          const responseTemplate = JSON.stringify(i.responseTemplate)
          promises.push(this.handler.send('save-validation', {
            endpoint: i.endpoint,
            method: i.method,
            requestTemplate,
            responseTemplate
          }))
        }
      })
      await Promise.all(promises)
      this.handler.send('stop-recording-all-endpoints', {})
      this.show = false
    }
    else {
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
  }

  handleSaveEvent(e: SaveTemplateResult): void {
    if (this.singleEndpointMode) {
      if (e.success) {
        this.$emit('announcement', this.$t('Validation template saved. Dialog closed'))
        this.show = false
      }
      else {
        this.$emit('announcement', this.$t('Validation template could not be saved. Dialog closed'))
        this.show = false
      }
    }
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
  max-height: 200px !important;
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
