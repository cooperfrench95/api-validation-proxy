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
import { mapGetters } from "vuex";
import { IPCHandler } from "../IPCHandler";

@Component({
  computed: {
    ...mapGetters({
      handler: "handler"
    })
  }
})
export default class HelloWorld extends Vue {
  url = "";
  handler!: IPCHandler;

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
    console.log("GETTT");
    const response = await this.handler.send("get-backend-url");
    console.log(response.url, "response");
    if (response.url) {
      this.url = response.url;
      console.log(this.url);
    }
  }

  async confirmURL() {
    const response = await this.handler.send("change-backend-url", {
      event: "change-backend-url",
      url: this.url
    });
  }

  get valid() {
    return this.url && this.urlRules[0](this.url);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.mainTitle {
  width: 100%;
}
</style>
