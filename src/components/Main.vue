<template>
  <v-app>
    <vue-announcer />
    <v-container>
      <v-row dense align="center" justify="center">
        <v-card width="400" class="mt-10 black" rounded>
          <v-card-title>
            <span class="mainTitle">
              {{ $t('Enter your dev backend URL') }}
            </span>
            <br>
            <v-row dense align="center">
              <v-col>
            <v-btn-toggle v-model="lang">
              <v-btn value="en">
                {{ 'English' }}<span class="emoji" role="img" aria-label="australia">🇦🇺</span>
              </v-btn>
              <v-btn value="zh">
                {{ '中文' }}<span class="emoji" role="img" aria-label="taiwan">🇹🇼</span>
              </v-btn>
            </v-btn-toggle>

              </v-col>
            </v-row>
          </v-card-title>
          <v-card-text>
            <v-row dense align="center" justify="center">
              <v-col cols="12">
                <v-text-field
                  v-model="url"
                  :placeholder="$t('Enter URL')"
                  :label="$t('Your backend URL')"
                  outlined
                  :rules="urlRules"
                  color="primary"
                  >{{ url }}</v-text-field
                >
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="path"
                  :label="$t('Path to your validation files')"
                  :placeholder="$t('Full path e.g. /home/user/project/validators/')"
                  outlined
                  :rules="pathRules"
                  color="primary"
                >{{ path }}</v-text-field>
              </v-col>
              <v-col cols="12">
                <v-subheader>
                  {{ $t('Be sure to point your client to http://localhost:3000') }}
                </v-subheader>
              </v-col>
              <v-col cols="12">
                <v-btn
                  block
                  outlined
                  color="primary"
                  @click.stop="confirmURL"
                  :disabled="!valid"
                  :aria-disabled="!valid"
                >
                  {{ $t('Continue') }}
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
import moment from 'moment';
import { IPCHandler } from "../IPCHandler";
import { Action, Getter } from "vuex-class";
import type { ActionMethod } from "vuex";
import { LocaleMessages } from 'vue-i18n';

@Component
export default class Main extends Vue {
  url = "";
  path = "";
  lang = 'en';

  @Getter("handler") handler!: IPCHandler;
  @Action("setPath") setPath!: ActionMethod;
  @Action("setURL") setURL!: ActionMethod;

  mounted(): void {
    setTimeout(() => {
      this.getLang();
      this.getURL();
    }, 200);
    setTimeout(() => {
      this.$announcer.set(`${this.$t('API Validation application loaded. Please enter your backend URL and path to validation folder, then press the continue button.')}`)
    }, 3000)
  }

  urlRules = [
    (v: string): boolean | string | LocaleMessages => {
      return (
        (!!v &&
          /((http|https):\/\/)?[a-zA-Z0-9.-_]{2,256}(:[0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])?(\/)$/.test(
            v
          )) ||
        this.$t("Invalid URL")
      );
    },
  ];

  pathRules = [
    (v: string): boolean | string | LocaleMessages => {
      // eslint-disable-next-line no-useless-escape
      return (!!v && /^(([a-zA-Z]{1}:\\)|\/)([a-zA-Z_-\s0-9.\]\\\/]+)(\\|\/)$/.test(v)) || this.$t("Invalid path")
    }
  ]

  getLang(): void {
    const localLang = localStorage.getItem('lang')
    if (localLang && ['en', 'zh'].includes(localLang)) {
      this.lang = localLang
    }
  }

  @Watch('lang')
  async setLang(val: 'en'|'zh'): Promise<void> {
    moment.locale(val)
    this.$i18n.locale = val
    await this.handler.send('change-lang', {
      event: 'change-lang',
      lang: val
    })
  }

  async getURL(): Promise<void> {
    const response = await this.handler.send("get-backend-url");
    if (localStorage.getItem('url')) {
      this.url = localStorage.getItem('url') || ''
      this.setURL(this.url)
    }
    else if (response.url) {
      this.url = response.url;
      this.setURL(this.url);
    }
    if (localStorage.getItem('path')) {
      this.path = localStorage.getItem('path') || ''
      this.setPath(this.path)
    }
    else if (response.path) {
      this.path = response.path;
      this.setPath(this.path)
    }
  }

  async confirmURL(): Promise<void> {
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
  onValidChanged(val: boolean): void {
    if (val) {
      this.$announcer.set(`${this.$t('You can now click the continue button')}`)
    }
    else {
      this.$announcer.set(`${this.$t('Continue button disabled. Please fill out the correct fields')}`)
    }
  }

  get valid(): boolean {
    return !!this.url && this.urlRules[0](this.url) === true && !!this.path && this.pathRules[0](this.path) === true;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.mainTitle {
  width: 100%;
}
.emoji {
  font-family: apple color emoji,segoe ui emoji,noto color emoji,android emoji,emojisymbols,emojione mozilla,twemoji mozilla,segoe ui symbol
}
</style>
