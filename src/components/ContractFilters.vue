<template>
  <div
    class="sidebar-filters"
    :class="{ 'in-modal': vModal }"
  >
    <div class="sidebar-filters-wrap">
      <div class="single-filter">
        <div class="filter-title bg-ghost-gray">
          <span>Filter by Contract Type</span>
          <div class="disclaimer">
            Learn more about <a href="https://www.phila.gov/departments/procurement-department/contracts-information/types-of-contracts/">contract types.</a>
          </div>
        </div>
        <div
          v-for="filter in contractTypeFilters"
          :key="filter.label"
          class="checkbox-wrap"
        >
          <input
            :id="filter.label"
            type="checkbox"
            class="hidden-checkbox"
            :value="filter.matchValue"
            :checked="isFilterChecked(filter.matchValue, 'contracttypes')"
            @change="update('contracttypes', $event)"
          >
          <label :for="filter.label">
            <span>{{ filter.label }}</span>
          </label>
        </div>
      </div>
      <div class="single-filter">
        <div class="filter-title bg-ghost-gray">
          <span>Filter by Estimated Size</span>
        </div>
        <div
          v-for="filter in sizeFilters"
          :key="filter.label"
          class="checkbox-wrap"
        >
          <input
            :id="filter.label"
            type="checkbox"
            class="hidden-checkbox"
            :value="filter.matchValue"
            :checked="isFilterChecked(filter.matchValue, 'sizes')"
            @change="update('sizes', $event)"
          >
          <label :for="filter.label">
            <span>{{ filter.label }}</span>
          </label>
        </div>
        <div class="post-disclaimer">
          <b>Disclaimer:</b> These price ranges are used to categorize contracts by approximate size. If you're not sure where an opportunity falls, you can select more than one filter.
        </div>
      </div>
    </div>
    <div class="single-filter">
      <div class="filter-title bg-ghost-gray">
        <span>Filter by Solicitation Type</span>
      </div>
      <div
        v-for="filter in solicitationFilters"
        :key="filter.label"
        class="checkbox-wrap"
      >
        <input
          :id="filter.label"
          :ref="`checkbox-${filter.matchValue}`"
          type="checkbox"
          class="hidden-checkbox"
          :value="filter.matchValue"
          :checked="isFilterChecked(filter.matchValue, 'solicitation')"
          @change="update('solicitation', $event)"
        >
        <label :for="filter.label">
          <span>{{ filter.label }}</span>
          <br>

        </label>
        <div
          v-if="filter.sublabel"
          class="sublabel"
          v-html="filter.sublabel"
        />
      </div>
    </div>
    <!-- <div class="single-filter">
      <div class="filter-title bg-ghost-gray">
        <span>Filter by Competition</span>
      </div>

      <div
        v-for="filter in competitionFilters"
        :key="filter.label"
        class="checkbox-wrap"
      >
        <input
          :id="filter.label"
          :ref="`checkbox-${filter.matchValue}`"
          type="checkbox"
          class="hidden-checkbox"
          :value="filter.matchValue"
          :checked="isFilterChecked(filter.matchValue, 'competition')"
          @change="update('competition', $event)"
        >
        <label :for="filter.label">
          <span>{{ filter.label }}</span>
          <br>
          
        </label>
        <div
          v-if="filter.sublabel"
          class="sublabel"
          v-html="filter.sublabel"
        />
      </div>
    </div> -->
    <div
      v-if="vModal"
      class="v-modal-btns"
    >
      <input
        class="apply-filters-btn button"
        type="button"
        value="Apply Filters"
        @click="$modal.hide('contract-filters')"
      > &nbsp;
    </div>
    <input
      class="button"
      type="button"
      value="Clear All Filters"
      :disabled="noneSelected"
      @click="clearAllFilters()"
    >
  </div>
</template>

<script>
export default {
  props: {
    contractTypeFilters: {
      type: Array,
      default: () => {
        return [];
      },
    },

    sizeFilters: {
      type: Array,
      default: () => {
        return [];
      },
    },
    solicitationFilters: {
      type: Array,
      default: () => {
        return [];
      },
    },
    competitionFilters: {
      type: Array,
      default: () => {
        return [];
      },
    },

    contracttypes: {
      type: Array,
      default: () => {
        return [];
      },
    },
    sizes: {
      type: Array,
      default: () => {
        return [];
      },
    },
    solicitation: {
      type: Array,
      default: () => {
        return [];
      },
    },
    competition: {
      type: Array,
      default: () => {
        return [];
      },
    },

    filterContracts: {
      type: Function,
      default: () => {
        return;
      },
    },
    clearAllFilters: {
      type: Function,
      default: () => {
        return;
      },
    },
    hasFilters: {
      type: Boolean,
      default: false,
    },
    vModal: {
      type: Boolean,
      default: false,
    },
  },
  computed:{
    noneSelected: function(){
      return (this.sizes.length === 0 && this.contracttypes.length === 0 && this.solicitation.length === 0);
    },
  },
  methods: {
    /**
     * @desc is checkbox checked
     * @param { String } value
     * @param { String } filter name to eval
     * @returns { Boolean }
     */
    isFilterChecked(value, filter) {
      if (this[filter].includes(value)) {
        return true;
      }
      return false;
    },

    /**
     * @desc emits filter updates back to parent
     * @param { String } filter name to eval
     * @param { Object } $event object
     */
    update(filter, e) {
      let newFilters = this[filter];
      if (e.target.checked) {
        if (!this[filter].includes(e.target.value)) {
          newFilters.push(e.target.value);
        }
      } else {
        newFilters = this[filter].filter(item => item !== e.target.value);
      }
      this.$emit(`update:${filter}`, newFilters);
      this.filterContracts();
    },
  },
};
</script>

<style lang="scss">
.checkbox-wrap {

    user-select: none;

    input[type="checkbox"]:focus + label {
      border:2px solid black;
    }

    input[type="checkbox"]+ label {
      border:2px solid white;
    }

    .hidden-checkbox {
      display: block;
      opacity: 0;         // hide it visually
      z-index: -1;        // avoid unintended clicks
      position: absolute; // don't affect other elements positioning
    }
  }
</style>
