<template>
  <v-app class="scroll-enabled">
    <v-container>
      <v-row dense align="center" justify="center">
        <v-col cols="12" v-if="connectionError">
          <v-subheader class="red">
            <v-icon class="pr-2">
              mdi-alert
            </v-icon>
            It appears your backend at
            <strong class="px-1">{{ url }}</strong> is down
          </v-subheader>
        </v-col>
        <v-col cols="3" style="text-align: left">
          <v-icon x-large @click.stop="$router.push('/')">
            mdi-arrow-left
          </v-icon>
        </v-col>
        <v-col cols="6">
          <h1>
            Requests
          </h1>
        </v-col>
        <v-col cols="3" style="text-align: right">
          <v-btn outlined color="primary" @click.stop="showRecorder = true">
            Recorder
          </v-btn>
        </v-col>
        <v-col cols="12">
          <v-expansion-panels>
            <v-expansion-panel
              v-for="(request) in requests"
              :ref="request.id"
              :key="request.id"
            >
              <v-expansion-panel-header :class="request.isValid ? '' : 'red lighten-1'">
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
                    `flex-grow: 0; ${
                      request.response.statusCode < 400
                        ? 'color: green'
                        : 'color: red'
                    }`"
                >
                  {{ request.response.statusCode }}
                </span>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row dense>
                  <v-col v-if="!request.isValid" cols="12">
                    <v-card outlined>
                      <v-card-title class="red lighten-1">
                        Request validation failures
                      </v-card-title>
                      <v-card-text class="cardTextClass">
                        <v-simple-table>
                          <thead>
                            <tr>
                              <th>Field</th>
                              <th>Issue</th>
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
                    <v-card outlined>
                      <v-card-title class="primary darken-4">
                        <span class="subtitle text-left">Request Headers</span>
                      </v-card-title>
                      <v-card-text class="cardTextClass">
                        <v-simple-table>
                          <thead>
                            <tr>
                              <th>Header</th>
                              <th>Value</th>
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
                    <v-card outlined>
                      <v-card-title class="primary darken-4">
                        <span class="subtitle text-left">Request Body</span>
                      </v-card-title>
                      <v-card-text class="cardTextClass">
                        {{ beautify(request.data) }}
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
                <v-row dense v-if="request.response">
                   <v-col v-if="!request.response.isValid" cols="12">
                    <v-card outlined>
                      <v-card-title class="red lighten-1">
                        Request validation failures
                      </v-card-title>
                      <v-card-text class="cardTextClass">
                        <v-simple-table>
                          <thead>
                            <tr>
                              <th>Field</th>
                              <th>Issue</th>
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
                    <v-card outlined>
                      <v-card-title
                        :class="
                          (request.response.statusCode < 400
                            ? 'green'
                            : 'red') + ' darken-4'"
                      >
                        <span class="subtitle text-left">Response Headers</span>
                      </v-card-title>
                      <v-card-text class="cardTextClass">
                        <v-simple-table>
                          <thead>
                            <tr>
                              <th>Header</th>
                              <th>Value</th>
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
                    <v-card outlined>
                      <v-card-title
                        :class="
                          (request.response.statusCode < 400
                            ? 'green'
                            : 'red') + ' darken-4'"
                      >
                        <span class="subtitle text-left">Response Body</span>
                      </v-card-title>
                      <v-card-text class="cardTextClass">
                        {{ beautify(request.response.data) }}
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>
    <Recorder v-model="showRecorder" />
    </v-container>
  </v-app>
</template>

<script lang="ts">
import moment from "moment";
import { Component, Vue } from "vue-property-decorator";
import { IPCHandler } from "../IPCHandler";
import {
  IncomingRequest,
  IncomingResponse,
  Request,
  ViewValidationFailureEvent,
} from "../types";
import { Getter } from "vuex-class";
import Recorder from "./Recorder.vue";

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

  mounted() {
    if (!this.handler.isListening()) {
      this.handler.listen();
    }
    this.handler.on("new-request", this.pushRequestIntoQueue);
    this.handler.on("new-response", this.pushResponseIntoQueue);
    this.handler.on("backend-down", this.backendDown);
    this.handler.on("view-validation-failure", this.viewValidationFailure);
  }

  beforeDestroy() {
    this.handler.on("new-request", this.pushRequestIntoQueue);
    this.handler.on("new-response", this.pushResponseIntoQueue);
    this.handler.on("backend-down", this.backendDown);
    this.handler.on("view-validation-failure", this.viewValidationFailure);
  }

  viewValidationFailure(event: ViewValidationFailureEvent) {
    const { id } = event;
    if (this.$refs[id]) {
      console.log(this.$refs[id], "ref");
      this.$refs[id][0].$el.scrollIntoView();
    }
  }

  backendDown() {
    this.connectionError = true;
  }

  pushResponseIntoQueue(incoming: IncomingResponse) {
    const correspondingRequest = this.requests.find((i) => {
      return i.id === incoming.response.id;
    });
    if (correspondingRequest) {
      this.$set(correspondingRequest, "response", incoming.response);
      this.connectionError = false;
    }
  }

  pushRequestIntoQueue(incoming: IncomingRequest) {
    console.log(incoming.request.invalidFields);
    this.requests.unshift(incoming.request);
  }

  getTimeSince(input: number): string {
    return moment(input).fromNow();
  }

  beautify(input: object): string {
    return JSON.stringify(input, null, 4);
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
