<template>
  <v-dialog v-if="show" :value="show" @input="emit('close')" width="600">
    <v-card role="dialog" width="600">
      <v-card-title tabindex="0">
        {{ $t('Formatting help') }}
      </v-card-title>
      <v-card-text>
        <v-row dense class="text-left">
          <v-col tabindex="0" cols="12">
            {{ $t('The following denotes the formatting required when editing your validation template as JSON.') }}
          </v-col>
          <v-col tabindex="0" cols="12">
            <ul>
              <li>{{ $t('Template must be valid JSON.') }}</li>
              <li>{{ $t('Key names cannot inherently contain question marks or colons. Adding a question mark to the end of a key denotes that it is optional, i.e. it may be undefined or not present on the object at all.') }}</li>
              <li>{{ $t('When denoting a type, the following are valid:') }}
                <ul>
                  <li v-for="(type, index) in typeOptions" :key="index">
                    <code>{{ type }}</code>
                  </li>
                </ul>
              </li>
              <li>{{ $t('UUIDs are expected to be v4 UUIDs') }}.</li>
              <li>{{ ('For non-primitive types (objects and arrays), instead of denoting the type with a string as above (e.g. ') }}<code>{{ $t('"id": "uuid"') }}</code>{{ $t(') you should denote the type literally, i.e. if id is an object it would be ') }}<code>{{ $t('"id": { (..your object here) ..}') }}</code></li>
              <li>{{ $t('Arrays must contain something that indicates what the array should contain. If the array is to contain a primitive type, for instance if it is an array of numbers, you can write an array containing the string containing that type: ') }}<code>"ids": ["number"]</code>{{ $t('. If the array is to contain non-primitive types, then as above, denote those directly. For example: ') }}<code>"myObjectArray": [{ "id": uuid", "name": "string" }]</code></li>
              <li>{{ ('You may combine multiple primitive types using the | operator. For instance, if ') }}<code>employeeID</code> {{ $t('can be either a uuid or a number, you could write: ') }}<code>"employeeID": "uuid|number"</code></li>
              <li>{{ $t('Strings can have a length property to indicate the desired length of the string. See the following examples:') }}
                <ul>
                  <li>{{ $t('String with length more than 0: ') }}<code>string&length>0</code></li>
                  <li>{{ $t('String with length less than 10: ') }}<code>{{ 'string&length<10' }}</code></li>
                  <li>{{ $t('String with length more than or equal to 10: ') }}<code>string&length>=10</code></li>
                  <li>{{ $t('String with length less than or equal to 10: ') }}<code>string&length<=10</code></li>
                  <li>{{ $t('String with length exactly 4: ') }}<code>string&length=4</code></li>
                </ul>
              </li>
            </ul>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-btn outlined block color="primary" @click.stop="emit('close')" aria-label="exit help dialog">
          {{ $t('Got it!') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class FormattingHelp extends Vue {
  @Prop() readonly show!: boolean;

  readonly typeOptions = [
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
}
</script>
