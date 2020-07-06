<template>
  <div class="app-footer anchor">
    <footer>
      <div class="row expanded">
        <div class="columns">
          <nav>
            <ul class="inline-list">
              <li>
                <a 
                  href="https://phila.gov/procurement"
                  target="_blank"
                >Procurement</a>
              </li>
              <li>
                <a 
                  href="#"
                  @click="$modal.show('howToUseModal')"
                >
                  How to use</a>
              </li>
              <li>
                <a 
                  href="https://phila.gov/feedback"
                  target="_blank"
                >Feedback</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  </div>
</template>


<script>
import VModal from 'vue-js-modal';

import Vue from "vue";
Vue.use(VModal);

export default {

};
</script>

<style lang="scss">
.app-footer.anchor {
  position: fixed;
  bottom: 0;
}
@media (max-width: 480px) {
  .app-footer.anchor{
 position: relative !important;
}
}
</style>