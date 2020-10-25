<template>
  <div>Worker</div>
</template>

<script lang="ts">
import app from "./index";

try {
  app.listen(3000);
} catch (e) {
  console.log("Port 3000 busy");
}

export default {
  name: "WorkerEntry"
};
</script>
