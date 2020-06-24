<template>
  <div class="main">
    <div class="intro-text">
      <p>To help you locate an opportunity for your business, Contracts Hub searches multiple websites through a single interface.</p>
      <p>You can find more opportunities on the <a href="https://www.phila.gov/rfp/">City’s RFI and RFP listing.</a></p>
      <p>For more details on how to find and apply to contract opportunities, see <a href="https://www.phila.gov/services/business-self-employment/bidding-on-a-city-contract/do-business-with-the-city/">how to do business with the City.</a></p>
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
        <div class="top-container">
          <div
            class="results-count"
            v-html="showNum"
          />
        
          <div class="sort-by-container">
            <span> Sort by </span>
            <div
              v-if="contracts.length > 0"
              class="sort-by"
            >
              <select
                id="sort-by"
                v-model="sort"
                @change="sortContracts()"
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
        </div>
    
        <div class="contracts-list">
          <paginate
            ref="paginator"
            name="contracts"
            :list="contracts"
            class="paginate-list"
            :per="10"
          >
            <div
              v-for="contract in paginated('contracts')"
              :key="contract.bid_number"
              class="single-contract"
            >
              <!-- <h2> {{ contract.opportunity_title }} </h2> -->
              <h2 
                v-if="contract.data_source == 'E-Contracts'"
                class="contract-header bg-ghost-gray"
              >
                <a :href="'https://philawx.phila.gov/econtract/default.aspx?LinkOppID=' + contract.bid_number">
                  {{ contract.type_code }} contract for {{ contract.department }}
                </a>
              </h2>
              <h2 
                v-if="contract.data_source == 'PHL-Contracts'"
                class="contract-header bg-ghost-gray"
              >
                <a :href="'https://www.phlcontracts.phila.gov/bso/external/bidDetail.sdo?bidId=' + contract.bid_number + '&parentUrl=activeBids'">
                  {{ contract.opportunity_description }}
                </a>
              </h2>
              <div class="contract-tags">
                <div
                  v-if="contract.contract_category"
                  class="contract-tag"
                  :class="getCorrespondingTag(contract.contract_category).class"
                >
                  {{ getCorrespondingTag(contract.contract_category).tag }}
                </div>
              
                <div
                  v-if="contract.estimated_amount !== null"
                  class="contract-tag"
                  :class="getAmountTag(contract.estimated_amount).class"
                >
                  {{ getAmountTag(contract.estimated_amount).tag }}
                </div>

                <div
                
                  class="contract-tag"
                  :class="getCorrespondingTag(contract.data_source).class"
                >
                  {{ getCorrespondingTag(contract.data_source).tag }}
                </div>
                <div

                  class="contract-tag"
                  :class="getCorrespondingTag('Open to anyone').class"
                >
                  {{ getCorrespondingTag('Open to anyone').tag }}
                </div>
              </div>
              <div class="description">
                <div 
                  v-if="contract.data_source == 'E-Contracts'"
                >
                  {{ contract.opportunity_description | truncate }}
                </div>
                <div 
                  v-if="contract.data_source == 'PHL-Contracts'"
                >
                  <div 
                    v-for="code in contract.nigp_codes"
                    :key="code"
                  >
                    {{ code }}
                  </div>
                </div>
              </div>
              <div class="last-data">
                <br>
                <b>Responses due: </b>
                <span>{{ contract.bid_available_date | showDate }} </span>
                <br>
                <b>Posted by: </b>
                <span>{{ contract.department }}</span>
                <br>
                <b>Number: </b>
                <span>{{ contract.bid_number }}</span>
                <br>
                <b>Date posted: </b>
                <span>{{ contract.open_bidding_begin_date | showDate }}</span>
                <div class="see-more-link">
                  <a
                    v-if="contract.data_source == 'E-Contracts'"
                    :href="'https://philawx.phila.gov/econtract/default.aspx?LinkOppID=' + contract.bid_number"
                  >
                    View details in eContractPhilly
                  </a>
                  <a
                    v-if="contract.data_source == 'PHL-Contracts'"
                    :href="'https://www.phlcontracts.phila.gov/bso/external/bidDetail.sdo?bidId=' + contract.bid_number + '&parentUrl=activeBids'"
                  >
                    View details in PHL Contracts
                  </a>
                </div>
              </div>
            </div>
          </paginate>
        
          <div
            
            class="pagination-tabs"
          >
            <paginate-links
              for="contracts"
              :async="true"
              :limit="3"
              :show-step-links="true"
              :hide-single-page="false"
              :step-links="{
                next: 'Next',
                prev: 'Previous'
              }"
              @change="scrollToTop"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import axios from "axios";
import ContractFilters from "./ContractFilters.vue";
import VuePaginate from 'vue-paginate';
import Vue from "vue";
// import VueFuse from "vue-fuse";
Vue.use(VuePaginate);

const endpoint =
    "https://phl.carto.com/api/v2/sql?q=select+*+from+contract_opportunities";

export default {
  name: "ContractsHub",
  components: {
    ContractFilters,
  },

  filters: {
    showDate: function(num) {
      return moment(num).format("MMMM DD, YYYY");
    },

    truncate: function(val) {
      if (val.length > 500) {
        return val.substring(0, 500) + '...' ;       
      } 
      return val;        
    },
  },
  data: function() {
    return {
      contracts: [],
      search: "",

      paginate: [ 'contracts' ],
      paginateStepLinks: {
        next: 'Next',
        prev: 'Previous',
      },

      competition: [],
      competitionFilters: [{
        label: "Open to local business entities only",
        sublabel: "Get ceritifed as a <a href='https://www.phila.gov/services/business-self-employment/bidding-on-a-city-contract/get-certified-as-a-local-business-entity/'>local business entity</a>",
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
        sublabel: "Evaluated under <a href='https://www.phila.gov/documents/best-value-guidelines/'> best value guidelines</a>",
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

  watch: {
    // sort (val) {
    //   if (val) {
    //     this.sortContracts();
    //   }
    // },
  },
  mounted: function() {
    this.getAllContracts();
  },
  methods: {
    getAllContracts: function() {
      axios.get(endpoint).then(response => {
        this.contracts = response.data.rows;
      })
        .catch(e=> {
          console.log(e);
        });
    },

    clearAllFilters: function() {
      return;
    },

    updateResultsList: function() {
      return;
    },

    sortContracts: function() {

      switch (this.sort) {
      case 'Responses due':
        
        this.contracts.sort((a, b) => {
          if (a.bid_available_date < b.bid_available_date) {
            return -1;
          }
          if (a.bid_available_date > b.bid_available_date) {
            return 1;
          }
          return 0;
        });
        break;
        
      case 'Contract title':
        this.contracts.sort((a, b) => {
          if (a.opportunity_title < b.opportunity_title) {
            return -1;
          }
          if (a.opportunity_title > b.opportunity_title) {
            return 1;
          }
          return 0;
        });
        break;
      
      case 'Department':
        this.contracts.sort((a, b) => {
          if (a.department < b.department) {
            return -1;
          }
          if (a.department > b.department) {
            return 1;
          }
          return 0;
        });
        break;
      
      case 'Date added':
        this.contracts.sort((a, b) => {
          if (a.open_bidding_begin_date < b.open_bidding_begin_date) {
            return -1;
          }
          if (a.open_bidding_begin_date > b.open_bidding_begin_date) {
            return 1;
          }
          return 0;
        });
        break;
        
      default:
        return;
        
      }
    },

    filterContracts: function() {
      return;
    },

    searchContracts: function() {
      return;
    },

    getAmountTag(num) {
      if (num > 100000) {
        return {
          tag: "Over 100k",
          class: "bg-yellow color-gray",
        };
      } else if (num < 340000) {
        return {
          tag: "Under $34k",
          class: "bg-vibrant-blue color-white",
        };
      } else if (34000 <= num <= 100000) {
        return {
          tag: "$34k-$100k",
          class: "bg-dark-green color-grey",
        };
      }

    },

    scrollToTop () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
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

        case "Services, Supplies, and Equipment":
          return {
            tag: "SS&E",
            class: "bg-electric-blue dark-gray",
          };
        case "E-Contracts":
          return {
            tag: "RFP",
            class: "bg-brown color-white",
          };
        case "PHL-Contracts":
          return {
            tag: "BID",
            class: "bg-orange color-gray",
          };

        case "LBE only":
          return {
            tag: "LBE ONLY",
            class: "bg-light-grey color-white",
          };
        case "Open to anyone":
          return {
            tag: "OPEN TO ANYONE",
            class: "bg-mint-green color-grey",
          };
        default:
          return;
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

main {
  margin-bottom: 50px;
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

.contracts-list ul {
  margin:0;
  padding: 0;
}

.side-bar {
    width: 30%;
}

.results-container {
    padding: 20px;
    width:70%;
}

.single-contract {
    margin-bottom: 30px;
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

.top-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.sort-by-container {
    display: flex;
    flex-direction: row;

    span {
        font-weight: 700;
        display: inline;
        line-height: 3rem;
        padding-right: 5px;
    }
    select {
        width: auto;
        display: inline-block;
    }
}

.pagination-tabs {
  float: right;
}

.single-filter {
  margin-bottom: 40px;
}

.filter-title {
    // margin-top: 40px;
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
    font-style: italic;
}

.sublabel {
    font-size: 12px;
    margin-left: 2rem;
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

.color-grey {
  color: #292828;
}

.bg-purple {
  background-color: #793d8f;
}

.bg-light-blue {
background-color: lightblue;
}
.bg-dark-blue {
background-color: #0f4d90 
}

.bg-brown {
background-color: #795549;
}

.bg-orange {
background-color: #ff9d14;
}

.bg-mint-green{
background-color: #c5f0b7;
}


.bg-vibrant-blue{
background-color: #2176d2;
}

.bg-dark-green{
background-color: #2b5f2b;
}

.bg-yellow{
  background-color: #f2c612;
}

.bg-light-grey{
background-color: #a1a1a1;
}

.see-more-link{
  float: right;
  text-decoration:underline;
}


</style>
