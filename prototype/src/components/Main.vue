<template>
  <v-app>
    <v-container>
      <v-row dense align="center" justify="center">
        <v-card width="400" class="mt-10">
          <v-card-title>
            <span class="mainTitle">
              Enter your dev backend URL
            </span>
          </v-card-title>
          <v-card-text>
            <v-row dense align="center" justify="center">
              <v-col cols="12">
                <v-text-field
                  v-model="url"
                  placeholder="Enter URL"
                  outlined
                  :rules="urlRules"
                  color="primary"
                  >{{ url }}</v-text-field
                >
              </v-col>
              <v-col cols="12">
                <v-subheader>
                  Be sure to point your client to http://localhost:3000
                </v-subheader>
              </v-col>
              <v-col cols="12">
                <v-btn
                  block
                  color="primary"
                  @click.stop="confirmURL"
                  :disabled="!valid"
                >
                  Continue
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-row>
    </v-container>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { IPCHandler } from "../IPCHandler";
import { Action, Getter } from 'vuex-class';
import type { ActionMethod } from 'vuex'

@Component
export default class Main extends Vue {
  url = "";

  @Getter('handler') handler!: IPCHandler
  @Action('setURL') setURL!: ActionMethod

  mounted() {
    this.getURL();
  }

  urlRules = [
    (v: string): boolean | string => {
      return (
        (!!v &&
          /((http|https):\/\/)?[a-zA-Z0-9.-_]{2,256}:([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])\//.test(
            v
          )) ||
        "Invalid URL"
      );
    }
  ];

  async getURL() {
    const response = await this.handler.send("get-backend-url");
    if (response.url) {
      this.url = response.url;
      this.setURL(this.url)
    }
  }

  async confirmURL() {
    const response = await this.handler.send("change-backend-url", {
      event: "change-backend-url",
      url: this.url
    });
    if (response.url === this.url && this.valid) {
      this.setURL(this.url)
      this.$router.push("/requests");
    }
  }

  get valid() {
    return this.url && this.urlRules[0](this.url) === true;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.mainTitle {
  width: 100%;
}
</style>
