<template>
  <v-app>
    <vue-announcer />
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
                  label="Your backend URL"
                  outlined
                  :rules="urlRules"
                  color="primary"
                  >{{ url }}</v-text-field
                >
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="path"
                  label="Path to your validation files"
                  placeholder="Full path e.g. /home/user/project/validators/"
                  outlined
                  :rules="pathRules"
                  color="primary"
                >{{ path }}</v-text-field>
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
                  :aria-disabled="!valid"
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
import { Component, Vue, Watch } from "vue-property-decorator";
import { IPCHandler } from "../IPCHandler";
import { Action, Getter } from "vuex-class";
import type { ActionMethod } from "vuex";

@Component
export default class Main extends Vue {
  url = "";
  path = "";

  @Getter("handler") handler!: IPCHandler;
  @Action("setPath") setPath!: ActionMethod;
  @Action("setURL") setURL!: ActionMethod;

  mounted() {
    this.getURL();
    setTimeout(() => {
      this.$announcer.set('API Validation application loaded. Please enter your backend URL and path to validation folder, then press the continue button.')
    }, 3000)
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
    },
  ];

  pathRules = [
    (v: string): boolean | string => {
      return (!!v && /^(([a-zA-Z]{1}:\\)|\/)([a-zA-Z_-\s0-9.\]\\\/]+)(\\|\/)$/.test(v)) || "Invalid path"
    }
  ]

  async getURL() {
    const response = await this.handler.send("get-backend-url");
    if (response.url) {
      this.url = response.url;
      this.setURL(this.url);
    }
    if (response.path) {
      this.path = response.path;
      this.setPath(this.path)
    }
  }

  async confirmURL() {
    const response = await this.handler.send("change-backend-url", {
      event: "change-backend-url",
      url: this.url,
      path: this.path,
    });
    if (response.url === this.url && response.path === this.path && this.valid) {
      this.setURL(this.url);
      this.setPath(this.path);
      this.$router.push("/requests");
    }
  }

  @Watch('valid')
  onValidChanged(val: boolean) {
    if (val) {
      this.$announcer.set('You can now click the continue button')
    }
    else {
      this.$announcer.set('Continue button disabled. Please fill out the correct fields')
    }
  }

  get valid() {
    return this.url && this.urlRules[0](this.url) === true && this.path && this.pathRules[0](this.path) === true;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.mainTitle {
  width: 100%;
}
</style>
