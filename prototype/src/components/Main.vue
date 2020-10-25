<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-text-field
          v-model="url"
          placeholder="Enter URL"
          outlined
          :rules="urlRules"
          >{{ url }}</v-text-field
        >
      </v-col>
    </v-row>
  </v-container>
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
    this.get();
  }

  urlRules = [
    (v: string): boolean | string => {
      return (
        (!!v &&
          /((http|https):\/\/)?[a-zA-Z0-9.-_]{2,256}:([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])/.test(
            v
          )) ||
        "Invalid URL"
      );
    }
  ];

  async get() {
    console.log("GETTT");
    const response = await this.handler.send("get-backend-url");
    console.log(response.url, "response");
    if (response.url) {
      this.url = response.url;
      console.log(this.url);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
