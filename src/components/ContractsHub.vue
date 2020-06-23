<template>
  <div class="main">
    <div class="intro-text">
      <p>To help you locate an opportunity for your business, Contracts Hub searches multiple websites through a single interface.</p>
      <p>You can find more opportunities on the City’s RFI and RFP listing.</p>
      <p>For more details on how to find and apply to contract opportunities, see how to do business with the City.</p>
    </div>
    <div class="search">
      <input
        id="search-bar"
        v-model="search"
        class="search-field"
        type="text"
        placeholder="Search by title or keyword"
      >
      <input
        ref="archive-search-bar"
        type="submit"
        class="search-submit"
        value="Search"
      >
      <button
        v-if="search.length > 0"
        class="clear-search-btn"
      >
        <i class="fas fa-times" />
      </button>
    </div>
    <div class="contracts-container">
      <div class="side-bar">
        <contract-filters
          :update-results-list="updateResultsList"
          :clear-all-filters="clearAllFilters"
          :contracttype.sync="contracttype"
          :size.sync="size"
          :solicitation.sync="solicitation"
          :competition.sync="competition"
          v-bind="{ contractTypeFilters, sizeFilters, solicitationFilters, competitionFilters, vModal: false }"
        />
      </div>
      <div class="results-container">
        <div class>
          <div
            class="results-count"
            v-html="showNum"
          />
        </div>
        <div class>
          <div
            v-if="contracts.length > 0"
            class="sort-by"
          >
            <label
              for="sort-by"
              aria-label="Sort By"
            >
              <span>Sort By</span>
            </label>
            <select
              id="sort-by"
              v-model="sort"
              @change="sortResults()"
            >
              <option
                v-for="sortByType in sortByTypes"
                :key="sortByType"
                :value="sortByType"
              >
                {{ sortByType }}
              </option>
            </select>
          </div>
        </div>
    
        <div class="contracts-list">
          <div
            v-for="contract in contracts"
            :key="contract.bid_number"
            class="single-contract"
          >
            <!-- <h2> {{ contract.opportunity_title }} </h2> -->
            <h2 class="contract-header bg-ghost-gray">
              {{ contract.type_code }} contract for {{ contract.department }}
            </h2>
            <div class="contract-tags">
              <div
                class="contract-tag"
                :class="getCorrespondingTag(contract.contract_category).class"
              >
                {{ getCorrespondingTag(contract.contract_category).tag }}
              </div>
              <div
                v-if="contract.estimated_amount"
                class="contract-tag"
                :class="getCorrespondingTag(contract.estimated_amount).class"
              >
                {{ getCorrespondingTag(contract.estimated_amount).tag }}
              </div>
              <div
                class="contract-tag"
                :class="getCorrespondingTag(contract.data_source).class"
              >
                {{ getCorrespondingTag(contract.data_source).tag }}
              </div>
              <div
                v-if="contract.lbe_only"
                class="contract-tag"
                :class="getCorrespondingTag(contract.lbe_only).class"
              >
                {{ getCorrespondingTag(contract.lbe_only).tag }}
              </div>
            </div>
            <div class="description">
              {{ contract.opportunity_description }}
              <!-- display nigp codes if its phl-contracts -->
            </div>
            <div class="last-data">
              <br>
              <b>Responses due:</b>
              <span>{{ contract.bid_available_date }}</span>
              <br>
              <b>Posted by:</b>
              <span>{{ contract.department }}</span>
              <br>
              <b>Number</b>
              <span>{{ contract.bid_number }}</span>
              <br>
              <b>Date posted:</b>
              <span>{{ contract.open_bidding_begin_date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import moment from "moment";
import axios from "axios";
import ContractFilters from "./ContractFilters.vue";
// import Vue from "vue";
// import VueFuse from "vue-fuse";

const endpoint =
    "https://phl.carto.com/api/v2/sql?q=select+*+from+contract_opportunities%20limit%2010";

export default {
  name: "ContractsHub",
  components: {
    ContractFilters,
  },
  data: function() {
    return {
      contracts: [],
      search: "",

      competition: [],
      competitionFilters: [{
        label: "Open to local business entities only",
        sublabel: "Get ceritifed as a local business entity",
        matchKey: "competition",
        matchValue: "LBE-only",
        valueStore: "competition",
      },
      {
        label: "Open to anyone",
        matchKey: "competition",
        matchValue: "open-to-all",
        valueStore: "competition",
      },
      ],
      solicitation: [],
      solicitationFilters: [{
        label: "Request for proposals",
        sublabel: "Evaluated under best value guidelines",
        matchKey: "solicitation",
        matchValue: "RFP",
        valueStore: "solicitation",
      },
      {
        label: "Invitation to bid",
        sublabel: "Awarded to lowest-qualified bidder",
        matchKey: "solicitation",
        matchValue: "IFB",
        valueStore: "solicitation",
      },
      ],
      size: [],
      sizeFilters: [{
        label: "Under $34,000",
        matchKey: "size",
        matchValue: "sub-34k",
        valueStore: "size",
      },
      {
        label: "$34,000 - $100,000",
        matchKey: "size",
        matchValue: "34k-100k",
        valueStore: "size",
      },
      {
        label: "Over $100,000",
        matchKey: "size",
        matchValue: "100k-plus",
        valueStore: "size",
      },
      ],
      contracttype: [],
      contractTypeFilters: [{
        label: "Concessions",
        matchKey: "contract_category",
        matchValue: "concessions",
        valueStore: "contracttype",
      },
      {
        label: "Personal and professional services",
        matchKey: "contract_category",
        matchValue: "PPS",
        valueStore: "contracttype",
      },
      {
        label: "Public works",
        matchKey: "contract_category",
        matchValue: "public-works",
        valueStore: "contracttype",
      },
      {
        label: "Services, supplies, and equipment",
        matchKey: "contract_category",
        matchValue: "SSE",
        valueStore: "contracttype",
      },
      ],
      sort: "Responses due",
      defaultSort: "Responses due",
      sortByTypes: [
        "Responses due",
        "Contract title",
        "Department",
        "Date added",
      ],
    };
  },
  computed: {
    showNum: function() {
      if (this.contracts.length) {
        return `<p>Showing all ${this.contracts.length} available opporunities.</p>`;
      }
      return "";
    },
  },
  mounted: function() {
    this.getAllContracts();
  },
  methods: {
    getAllContracts: function() {
      axios.get(endpoint).then(response => {
        this.contracts = response.data.rows;
      });
    },

    clearAllFilters: function() {
      return;
    },

    updateResultsList: function() {
      return;
    },

    sortContracts: function() {
      return;
    },

    getCorrespondingTag(tag) {
      if (tag !== "") {
        switch (tag) {
        case "Professional Services":
          return {
            tag: "Pro services",
            class: "bg-purple color-white",
          };
        case "Concessions":
          return {
            tag: "Concessions",
            class: "bg-dark-grey color-white",
          };
        case "Public Works":
          return {
            tag: "Public works",
            class: "bg-dark-blue color-white",
          };

        case "Services, supplies, and equipment":
          return {
            tag: "SSE",
            class: "bg-light-blue dark-gray",
          };
        case "E-Contracts":
          return {
            tag: "RFP",
            class: "bg-brown color-white",
          };
        case "PHL-Contracts":
          return {
            tag: "BID",
            class: "bg-orange color-white",
          };

        case "LBE only":
          return {
            tag: "LBE ONLY",
            class: "bg-light-grey color-white",
          };
        case "Open to anyone":
          return {
            tag: "OPEN TO ANYONE",
            class: "bg-mint-green dark-grey",
          };

        case !isNaN(tag):
          if (parseInt(tag, 10) > 100000) {
            return {
              tag: "Over 100k",
              class: "bg-dark-green color-white",
            };
          } else if (parseInt(tag, 10) < 340000) {
            return {
              tag: "Under $34k",
              class: "bg-vibrant-blue color-white",
            };
          } else if (34000 <= parseInt(tag, 10) <= 100000) {
            return {
              tag: "$34k-$100k",
              class: "bg-yellow dark-grey",
            };
          }
          break;
        default:
          return {
            tag: tag,
            class: "bg-dark-gray",
          };
        }
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.main {
    width: 80rem;
    margin: 0 auto;
}

.intro-text {
    margin: 2rem 0;
}

.contract-header {
    /* padding-top: 5px; */
    line-height: 1.5;
    padding: 2px 10px;
    background-color: #a1a1a1;
    margin: 3px 2px;
    font-weight: 700;
    color: #0f4d90;
    /* text-transform: uppercase; */
    font-size: 20px;
}

.contracts-container {
    display: flex;
}

.side-bar {
    min-width: 30%;
}

.results-container {
    padding: 20px;
}

.single-contract {
    margin-bottom: 20px;
}

.contract-tag {
    display: inline-block;
    line-height: 1;
    padding: 2px 10px;
    background-color: #a1a1a1;
    margin: 3px 2px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    font-size: 12px;
}

.contract-tags {
    margin: 10px 0 15px;
    line-height: 1.1;
}

.sort-by {
    text-align: right;
    span {
        font-weight: 700;
    }
    select {
        width: auto;
        display: inline-block;
    }
}

.filter-title {
    margin-top: 40px;
    line-height: 1;
    padding: 15px 10px;
    background-color: #a1a1a1;
    span {
        font-weight: 700;
        text-transform: uppercase;
        font-size: 16px;
        font-family: 'Montserrat', 'Tahoma', sans-serif
    }
    .disclaimer {
        margin-top: 5px;
        font-size: 13px;
    }
}

.post-disclaimer {
    margin-top: 10px;
    margin-left: 5px;
}

.sublabel {
    font-size: 12px;
    margin-left: 1.5rem;
}

.checkbox-wrap {
    // margin-bottom: 20px;
    label {
      user-select: none;
        span {
            color: black;
            font-weight: 400;
        }
    }
}

.clear-all-btn {
    margin-top: 40px;
}

.color-white{
  color: white;
}

.bg-purple {
  background-color: purple;
}

.bg-light-blue {
background-color: lightblue;
}
.bg-dark-blue {
background-color: darkblue;
}

.bg-brown {
background-color: burlywood;
}

.bg-orange {
background-color: orange;
}

.bg-mint-green{
background-color: greenyellow;
}

.bg-dark-green{
background-color: darkgreen;
}

.bg-vibrant-blue{
background-color: teal;
}

.bg-yellow{
  background-color: yellow;
}

.bg-light-grey{
background-color: grey;
}
</style>
