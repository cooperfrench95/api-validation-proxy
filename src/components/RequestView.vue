<template>
  <v-app class="scroll-enabled">
    <vue-announcer v-if="!announcerDead" />
    <v-container>
      <v-row dense align="center" justify="center">
        <v-col cols="12" v-if="connectionError">
          <v-subheader class="red">
            <v-icon class="pr-2" aria-label="Alert" aria-hidden="false">
              mdi-alert
            </v-icon>
            {{ $t('It appears your backend at') }}
            <strong class="px-1">{{ url }}</strong>{{ $t(' is down') }}
          </v-subheader>
        </v-col>
        <v-col cols="3" style="text-align: left">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-icon x-large v-on="on" @click.stop="$router.push('/')" aria-label="Exit request view">
                mdi-arrow-left
              </v-icon>
            </template>
            {{ $t('Back') }}
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-icon class="ml-3" x-large @click.stop="drawer = !drawer" v-on="on">
                mdi-menu
              </v-icon>
            </template>
            {{ $t('View, edit, or export validation templates') }}
          </v-tooltip>
        </v-col>
        <v-col cols="6">
          <h1>
            {{ $t('Requests') }}
          </h1>
        </v-col>
        <v-col cols="3" style="text-align: right">
          <v-menu :close-on-content-click="false" offset-y>
            <template v-slot:activator="{ on }">
              <v-icon class="mr-2" v-on="on">mdi-settings</v-icon>
            </template>
            <v-list max-width="400">
              <span class="title">{{ $t('Performance settings') }}</span>
              <v-divider />
              <v-subheader class="my-4" style="text-align: left">
                {{ $t('Increasing any of these numbers significantly may harm performance. You should try to find the right balance that works for your machine.') }}
              </v-subheader>
              <v-divider />
              <v-list-item>
                <v-list-item-content>
                  <span style="text-align: left">{{ $t('Amount of array members to perform full validation on in long array responses, where array members are non-primitive (e.g. objects or arrays): ') }}</span>
                  <v-text-field v-model="arrayCheckLimit" type="number" :rules="[v => v && v > 0 && !isNaN(v)]"></v-text-field>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <span style="text-align: left">{{ $t('Max. length of displayed JSON response bodies: ') }}</span>
                  <v-text-field v-model="JSONDisplayLimit" type="number" :rules="[v => v && v > 0 && !isNaN(v)]"></v-text-field>
                </v-list-item-content>
              </v-list-item>
               <v-list-item>
                <v-list-item-content>
                  <span style="text-align: left">{{ $t('Amount of requests to keep in memory: ') }}</span>
                  <v-text-field v-model="requestMemoryLimit" type="number" :rules="[v => v && v > 0 && !isNaN(v)]"></v-text-field>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn outlined color="primary" @click.stop="showRecorder = true">
            {{ $t('Recorder') }}
          </v-btn>
        </v-col>
        <v-col cols="12">
          <v-expansion-panels>
            <v-expansion-panel
              v-for="(request) in requests"
              :ref="request.id"
              :key="request.id"
              class="mb-1"
              :style="`border: 1px solid ${request.isValid === true && (!request.response || request.response.isValid) ? 'green' : (request.isValid === false || (request.response && request.response.isValid === false)) ? 'red' : 'white'}`"
            >
              <v-expansion-panel-header color="black">
                  <template v-slot:default="{ open }">
                    <div style="display: flex" role="button" :aria-label="request.method + ' ' + request.destination + ' ' + getTimeSince(request.timestamp) + 'Status: ' + (request.response ? request.response.statusCode + ('Valid: ' + request.isValid) : 'Unknown')" :aria-expanded="open" aria-hidden="false">
                      <span style="flex-grow: 1">
                        {{ request.method.toUpperCase() }} - {{ request.destination }}
                      </span>
                      <span class="text--right pr-3" style="flex-grow: 0">
                        {{ getTimeSince(request.timestamp) }}
                      </span>
                      <v-progress-circular
                        size="20"
                        v-if="!request.response"
                        indeterminate
                      />
                      <span
                        v-else
                        class="text--right pr-3"
                        :style="
                          `flex-grow: 0; font-weight: 1000; ${
                            request.response.statusCode < 400
                              ? 'color: green'
                              : 'color: red'
                          }`"
                      >
                        {{ request.response.statusCode }}
                      </span>

                    </div>
                  </template>
                  <template v-slot:actions>
                    <v-icon aria-hidden="false" role="button" aria-label="expand">$expand</v-icon>
                  </template>
              </v-expansion-panel-header>
              <v-expansion-panel-content color="black">
                <v-row dense>
                  <v-col v-if="!request.isValid" cols="12">
                    <v-card :link="false" :ripple="false" outlined tabindex="0">
                      <v-card-title clickable="false" class="red darken-3">
                        {{ $t('Request validation failures') }}
                      </v-card-title>
                      <v-card-text class="cardTextClass">
                        <v-simple-table class="black">
                          <thead>
                            <tr>
                              <th>{{ $t('Field') }}</th>
                              <th>{{ $t('Issue') }}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="issue in request.invalidFields" :key="issue.key">
                              <td>{{ issue.key }}</td>
                              <td>{{ issue.reason }}</td>
                            </tr>
                          </tbody>
                        </v-simple-table>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="6">
                    <v-card :ripple="false" outlined tabindex="0">
                      <v-card-title clickable="false" class="primary darken-4">
                        <span class="subtitle text-left">{{ ('Request Headers') }}</span>
                      </v-card-title>
                      <v-card-text class="cardTextClass">
                        <v-simple-table class="black">
                          <thead>
                            <tr>
                              <th>{{ $t('Header') }}</th>
                              <th>{{ $t('Value') }}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(header, key) in request.headers"
                              :key="key"
                            >
                              <td class="text-left" valign="top">
                                {{ key }}
                              </td>
                              <td
                                class="text-left"
                                style="max-width: 300px;"
                                valign="top"
                              >
                                <div v-if="key === 'host'">
                                  {{ header }}
                                  <br />
                                  <strong class="caption bold">{{
                                    ` (forwarded to ${url})`
                                  }}</strong>
                                </div>
                                <div v-else valign="top">
                                  {{ header }}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </v-simple-table>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="6">
                    <v-card :ripple="false" outlined tabindex="0">
                      <v-card-title clickable="false" class="primary darken-4">
                        <span class="subtitle text-left">{{ $t('Request Body') }}</span>
                      </v-card-title>
                      <v-card-text class="cardTextClass">
                        {{ beautify(request.data, $t, JSONDisplayLimit, true) }}
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
                <v-row dense v-if="request.response">
                   <v-col v-if="!request.response.isValid" cols="12">
                    <v-card :ripple="false" outlined tabindex="0">
                      <v-card-title clickable="false" class="red lighten-1">
                        {{ $t('Response validation failures') }}
                      </v-card-title>
                      <v-card-text class="cardTextClass">
                        <v-simple-table class="black">
                          <thead>
                            <tr>
                              <th>{{ $t('Field') }}</th>
                              <th>{{ $t('Issue') }}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="issue in request.response.invalidFields" :key="issue.key">
                              <td>{{ issue.key }}</td>
                              <td>{{ issue.reason }}</td>
                            </tr>
                          </tbody>
                        </v-simple-table>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="6">
                    <v-card :ripple="false" outlined tabindex="0">
                      <v-card-title
                        :class="
                          (request.response.statusCode < 400
                            ? 'green'
                            : 'red') + ' darken-4'"
                      >
                        <span class="subtitle text-left">{{ $t('Response Headers') }}</span>
                      </v-card-title>
                      <v-card-text class="cardTextClass">
                        <v-simple-table class="black">
                          <thead>
                            <tr>
                              <th>{{ $t('Header') }}</th>
                              <th>{{ $t('Value') }}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(header, key) in request.response.headers"
                              :key="key"
                            >
                              <td class="text-left" valign="top">
                                {{ key }}
                              </td>
                              <td
                                class="text-left"
                                style="max-width: 300px;"
                                valign="top"
                              >
                                <div v-if="key === 'host'">
                                  {{ header }}
                                  <br />
                                  <strong class="caption bold">{{
                                    ` (forwarded to ${url})`
                                  }}</strong>
                                </div>
                                <div v-else valign="top">
                                  {{ header }}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </v-simple-table>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="6">
                    <v-card :ripple="false" outlined tabindex="0">
                      <v-card-title
                        :class="
                          (request.response.statusCode < 400
                            ? 'green'
                            : 'red') + ' darken-4'"
                      >
                        <span class="subtitle text-left">{{ $t('Response Body') }}</span>
                      </v-card-title>
                      <v-card-text class="cardTextClass">
                        {{ beautify(request.response.data, $t, JSONDisplayLimit, true) }}
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12">
                        <small>{{ $t('(Only the first element in long array responses is parsed for performance reasons)') }}</small>
                  </v-col>
                </v-row>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>
    <Recorder v-if="showRecorder" v-model="showRecorder" :JSONDisplayLimit="JSONDisplayLimit" @announcement="announce" />
    </v-container>
    <v-navigation-drawer v-model="drawer" absolute bottom temporary width="300">
      <v-list>
        <v-list-item>
          <v-btn outlined @click.stop="exportAllAsMarkdown" primary>
            <v-icon>mdi-download</v-icon> {{ $t('Export as markdown') }}
          </v-btn>
        </v-list-item>
        <v-list-item
          v-for="endpoint in endpoints"
          :key="endpoint.name"
          :ripple="false"
          :class="selectedEndpoint && selectedEndpoint.name === endpoint.name ? 'black' : ''"
          @click.stop="selectEndpoint(endpoint)"
        >
          /{{ endpoint.name }}
        </v-list-item>
      </v-list>
      <v-dialog
        v-if="selectedEndpoint"
        :value="!!selectedEndpoint"
        @input="selectedEndpoint=null"
        width="800"
      >
        <v-card width="800">
          <v-card-title>
            /{{ selectedEndpoint.name }}
          </v-card-title>
          <v-card-text style="text-align: left; overflow: scroll; max-height: 700px">
            <v-row dense>
              <v-col cols="12">
                <span>{{ $t('Request') }}</span>
              </v-col>
              <v-col v-for="(method, index) in getKeys(selectedEndpoint.unStringifiedContent.request)" :key="index" cols="12">
                <v-row dense class="px-4">
                  <v-col cols="12">
                    {{ method }}
                  </v-col>
                  <v-col v-for="specificURL in getKeys(selectedEndpoint.unStringifiedContent.request[method])" :key="specificURL" cols="12">
                    <v-row dense class="px-4">
                      <v-col cols="12">
                        {{ specificURL }}
                      </v-col>
                      <v-col cols="12">
                        <v-subheader v-if="method === 'GET'">
                          {{ $t('GET requests should not have JSON bodies and are therefore ignored') }}
                        </v-subheader>
                        <v-textarea
                          v-else
                          v-model="selectedEndpoint.unStringifiedContent.request[method][specificURL]"
                          :rules="[v => selectedEndpointJSONValid(selectedEndpoint.unStringifiedContent.request[method][specificURL])]"
                          :style="(selectedEndpointJSONValid(selectedEndpoint.unStringifiedContent.request[method][specificURL]) ? 'background-color:  rgba(17, 123, 17, 0.426)' : 'background-color: rgba(184, 16, 16, 0.419)') + '; '"
                          role="textbox"
                          auto-grow
                          aria-label="Edit your JSON here"
                          @change="(val) => $set(selectedEndpoint.unStringifiedContent.response[method]. specificURL, val)"
                        />
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-col>
              <v-col cols="12">
                <span>{{ $t('Response') }}</span>
              </v-col>
              <v-col v-for="(method, index) in getKeys(selectedEndpoint.unStringifiedContent.response)" :key="index+'response'" cols="12">
                <v-row dense class="px-4">
                  <v-col cols="12">
                    {{ method }}
                  </v-col>
                  <v-col v-for="specificURL in getKeys(selectedEndpoint.unStringifiedContent.response[method])" :key="specificURL" cols="12">
                    <v-row dense class="px-4">
                      <v-col cols="12">
                        {{ specificURL }}
                      </v-col>
                      <v-col cols="12">
                        <v-textarea
                          v-model="selectedEndpoint.unStringifiedContent.response[method][specificURL]"
                          :rules="[v => selectedEndpointJSONValid(selectedEndpoint.unStringifiedContent.response[method][specificURL])]"
                          :style="(selectedEndpointJSONValid(selectedEndpoint.unStringifiedContent.response[method][specificURL]) ? 'background-color:  rgba(17, 123, 17, 0.426)' : 'background-color: rgba(184, 16, 16, 0.419)') + '; '"
                          role="textbox"
                          auto-grow
                          aria-label="Edit your JSON here"
                          @change="(val) => $set(selectedEndpoint.unStringifiedContent.response[method]. specificURL, val)"
                        />
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn outlined @click.stop="selectedEndpoint = null">
              {{ $t('Cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn outlined class="primary" @click.stop="saveSelectedEndpoint(selectedEndpoint)" :disabled="!allValidInJSON">
              {{ $t('Save')}}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-navigation-drawer>
  </v-app>
</template>

<script lang="ts">
import moment from "moment";
import * as bluebird from 'bluebird';
import { saveAs } from 'file-saver';
import { Component, Vue, Watch } from "vue-property-decorator";
import { IPCHandler } from "../IPCHandler";
import {
  EndpointContent,
  IncomingRequest,
  IncomingResponse,
  Request,
  SelectedEndpointContent,
  unStringifiedContent,
  ViewValidationFailureEvent,
} from "../types";
import { Getter } from "vuex-class";
import Recorder from "./Recorder.vue";
import { beautify, convertToMarkdown, getLinesForDisplay, validateType } from './functions';

@Component({
  components: {
    Recorder,
  },
})
export default class RequestView extends Vue {
  @Getter("handler") handler!: IPCHandler;
  @Getter("url") url!: string;

  $refs!: {
    input: HTMLElement;
  };

  requests: Request[] = [];
  connectionError = false;
  showRecorder = false;
  announcerDead = false;
  requestMemoryLimit = 100;
  JSONDisplayLimit = 4000;
  arrayCheckLimit = 1;
  drawer = false;
  endpoints: EndpointContent[] = [];
  selectedEndpoint: null|SelectedEndpointContent = null;
  beautify = beautify;
  getLinesForDisplay = getLinesForDisplay;
  validateType = validateType;

  @Watch('requests')
  onRequestsChange(val: Request[]): void {
    if (val.length > this.requestMemoryLimit) {
      val.splice(0, 1)
    }
  }

  @Watch('requestMemoryLimit')
  onRequestMemoryLimitChange(val: number): void {
    if (val && !isNaN(val)) {
      localStorage.setItem('requestMemoryLimit', `${val}`)
    }
  }

  @Watch('JSONDisplayLimit')
  onJSONDisplayLimitChange(val: number): void {
    if (val && !isNaN(val)) {
      localStorage.setItem('JSONDisplayLimit', `${val}`)
    }
  }

  @Watch('arrayCheckLimit')
  onArrayCheckLimitChange(val: number): void {
    if (val && !isNaN(val)) {
      localStorage.setItem('arrayCheckLimit', `${val}`)
      this.handler.send('arrayCheckLimit', {
        event: 'arrayCheckLimit',
        value: val
      })
    }
  }

  selectedEndpointJSONValid(section: string): boolean {
    if (!this.selectedEndpoint) return true
    let valid = false;
    try {
      const object = JSON.parse(section)
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

  get allValidInJSON(): boolean {
    if (!this.selectedEndpoint) return false
    let valid = true
    const { unStringifiedContent } = this.selectedEndpoint
    Object.keys(unStringifiedContent).forEach(type => {
      Object.keys(unStringifiedContent[type]).forEach(method => {
        if (!(method === 'GET' && type === 'request')) {
          Object.values(unStringifiedContent[type][method]).forEach(str => {
            if (typeof str === 'string') {
              const res = this.selectedEndpointJSONValid(str)
              if (!res) valid = false
            }
          })
        }
      })
    })
    return valid
  }

  @Watch('drawer')
  async onDrawerOpenAndClose(): Promise<void> {
    const allTemplates = await this.handler.send('getAllTemplates', {
      event: 'getAllTemplates'
    })
    const endpoints: EndpointContent[] = []
    if (allTemplates.templates) {
      Object.keys(allTemplates.templates).forEach((endpoint) => {
        const obj: EndpointContent = {
          name: endpoint,
          content: allTemplates.templates ? allTemplates.templates[endpoint] : null
        }
        endpoints.push(obj)
      })
      this.endpoints = endpoints;
    }
  }

  selectEndpoint(obj: EndpointContent): void {
    if (obj.content) {
      const stringifiedSome: unStringifiedContent = {
        request: {},
        response: {}
      }
      Object.keys(obj.content).forEach(type => {
        const newTypeObj = {}
        Object.keys(obj.content[type]).forEach(method => {
          newTypeObj[method] = {}
          Object.keys(obj.content[type][method]).forEach(endpoint => {
            newTypeObj[method][endpoint] = this.beautify(
              obj.content[type][method][endpoint],
              this.$t
            )
          })
        })
        stringifiedSome[type] = newTypeObj
      })
      this.selectedEndpoint = {
        ...obj,
        content: JSON.stringify(obj.content, null, 4),
        unStringifiedContent: stringifiedSome,
      }
    }
  }

  async mounted(): Promise<void> {
    if (!this.handler.isListening()) {
      this.handler.listen();
    }
    this.$announcer.set(`${this.$t('This is the requests view. It consists of all the incoming requests coming in to your backend URL from localhost. It will notify you when a request does not conform to your validation templates.')}`)
    setTimeout(() => {
      this.announcerDead = true
    }, 1000);
    const requestMemoryLimit = Number(localStorage.getItem('requestMemoryLimit'));
    const JSONDisplayLimit = Number(localStorage.getItem('JSONDisplayLimit'));
    const arrayCheckLimit = Number(localStorage.getItem('arrayCheckLimit'));
    if (requestMemoryLimit && !isNaN(requestMemoryLimit)) {
      this.requestMemoryLimit = requestMemoryLimit
    }
    if (JSONDisplayLimit && !isNaN(JSONDisplayLimit)) {
      this.JSONDisplayLimit = JSONDisplayLimit
    }
    if (arrayCheckLimit && !isNaN(arrayCheckLimit)) {
      this.arrayCheckLimit = arrayCheckLimit
    }
    this.handler.on("new-request", this.pushRequestIntoQueue);
    this.handler.on("new-response", this.pushResponseIntoQueue);
    this.handler.on("backend-down", this.backendDown);
    this.handler.on("view-validation-failure", this.viewValidationFailure);
  }

  beforeDestroy(): void {
    this.handler.on("new-request", this.pushRequestIntoQueue);
    this.handler.on("new-response", this.pushResponseIntoQueue);
    this.handler.on("backend-down", this.backendDown);
    this.handler.on("view-validation-failure", this.viewValidationFailure);
  }

  viewValidationFailure(event: ViewValidationFailureEvent): void {
    const { id } = event;
    if (this.$refs[id]) {
      this.$refs[id][0].$el.scrollIntoView();
    }
  }

  backendDown(): void {
    this.connectionError = true;
  }

  pushResponseIntoQueue(incoming: IncomingResponse): void {
    const correspondingRequest = this.requests.find((i) => {
      return i.id === incoming.response.id;
    });
    if (correspondingRequest) {
      this.$set(correspondingRequest, "response", incoming.response);
      this.connectionError = false;
    }
  }

  pushRequestIntoQueue(incoming: IncomingRequest): void {
    this.requests.unshift(incoming.request);
  }

  getTimeSince(input: number): string {
    return moment(input).fromNow();
  }

  announce(message: string): void {
    this.announcerDead = false
    this.$announcer.set(message)
    setTimeout(() => {
      this.announcerDead = true
    }, 5000);
  }

  getKeys(obj: Record<string, unknown>): string[] {
    return Object.keys(obj)
  }

  async saveSelectedEndpoint(obj: SelectedEndpointContent): Promise<void> {
    const { unStringifiedContent } = obj
    const endPointsWithReqAndResponse = {}
    Object.keys(unStringifiedContent).map(async (type: string) => {
      if (type === 'request') {
        Object.keys(unStringifiedContent[type]).map(async (method: string) => {
          Object.keys(unStringifiedContent[type][method]).map(async (endpoint: string) => {
            if (!endPointsWithReqAndResponse[endpoint]) endPointsWithReqAndResponse[endpoint] = {}
            if (!endPointsWithReqAndResponse[endpoint][method]) {
              endPointsWithReqAndResponse[endpoint][method] = {
                request: {},
                response: {}
              }
            }
            endPointsWithReqAndResponse[endpoint][method].request = unStringifiedContent[type][method][endpoint]
          })
        })
      }
      else {
        Object.keys(unStringifiedContent[type]).map(async (method: string) => {
          Object.keys(unStringifiedContent[type][method]).map(async (endpoint: string) => {
            if (!endPointsWithReqAndResponse[endpoint]) endPointsWithReqAndResponse[endpoint] = {}
            if (!endPointsWithReqAndResponse[endpoint]) {
              endPointsWithReqAndResponse[endpoint][method] = {
                request: {},
                response: {}
              }
            }
            endPointsWithReqAndResponse[endpoint][method].response = unStringifiedContent[type][method][endpoint]
          })
        })
      }
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await bluebird.mapSeries(Object.keys(endPointsWithReqAndResponse), async (key: string) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return bluebird.mapSeries(Object.keys(endPointsWithReqAndResponse[key]), async (method: string) => {
        return this.handler.send('save-validation', {
          endpoint: key,
          method: method,
          requestTemplate: endPointsWithReqAndResponse[key][method].request,
          responseTemplate: endPointsWithReqAndResponse[key][method].response
        })
      })
    })
    this.selectedEndpoint = null
    this.onDrawerOpenAndClose()
  }

  async exportAllAsMarkdown(): Promise<void> {
    await this.onDrawerOpenAndClose()
    const ultraObjectForMDFile: unStringifiedContent = {
      request: {},
      response: {}
    }
    this.endpoints.forEach(endpoint => {
      Object.keys(endpoint.content).forEach(type => {
        Object.keys(endpoint.content[type]).forEach(method => {
          if (!ultraObjectForMDFile[type][method]) {
            ultraObjectForMDFile[type][method] = {}
          }
          Object.keys(endpoint.content[type][method]).forEach(specificEndpoint => {
            if (!ultraObjectForMDFile[type][method][specificEndpoint]) {
              ultraObjectForMDFile[type][method][specificEndpoint] = {}
            }
            const stringified = JSON.stringify(endpoint.content[type][method][specificEndpoint], null, 4)
            ultraObjectForMDFile[type][method][specificEndpoint] = stringified
          })
        })
      })
    })
    const result = await convertToMarkdown(ultraObjectForMDFile)
    const file = new File([result], "endpoints.md", { type: 'text/plain;charset=utf-8' })
    saveAs(file)
  }
}
</script>

<style scoped>
h1 {
  color: white;
}
.cardTextClass {
  height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
  text-align: left;
  background: black;
}
::-webkit-scrollbar {
  width: 10px;
  background-color: #1e1e1e;
}
::-webkit-scrollbar-corner {
  background: rgba(0, 0, 0, 0);
}
::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 10px;
  border: 4px solid rgba(0, 0, 0, 0);
  background-clip: content-box;
  min-width: 32px;
  min-height: 32px;
}
::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0);
}
</style>
