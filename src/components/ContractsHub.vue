<template>
  <div>
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
          placeholder="Search by contract title, keyword, department, or NIGP code"
        >
        <input
          type="submit"
          class="search-submit"
          value="Search"
        >
        <button
          v-if="search.length > 0"
          class="clear-search-btn"
          @click="clearAllFilters()"
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
        
            <div 
              v-show="contracts.length > 0"
              class="sort-by-container"
            >
              <div
                v-if="contracts.length > 0"
                class="sort-by"
              >
                <label 
                  for="sort-by"
                  aria-label="Sort By"
                >Sort by 
                </label>
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
                <h2 
                  class="contract-header bg-ghost-gray"
                >
                  <a 
                    target="_blank" 
                    :href="contract.url"
                  >
                    {{ contract.display_title }}
                  </a>
                </h2>
                <div class="contract-details">
                  <div class="contract-tags">
                    <div
                      v-if="contract.contract_category && contract.contract_category !== null "
                      class="contract-tag"
                      :class="getCorrespondingTag(contract.contract_category).class"
                    >
                      {{ getCorrespondingTag(contract.contract_category).tag }}
                    </div>
              
                    <div
                      v-if="contract.estimated_amount && contract.estimated_amount !== null"
                      class="contract-tag"
                      :class="getAmountTag(contract.estimated_amount).class"
                    >
                      {{ getAmountTag(contract.estimated_amount).tag }}
                    </div>

                    <div
                      v-if="contract.solicitation_type && contract.solicitation_type !== null"

                      class="contract-tag"
                      :class="getCorrespondingTag(contract.solicitation_type).class"
                    >
                      {{ getCorrespondingTag(contract.solicitation_type).tag }}
                    </div>
                    <!-- <div

                  class="contract-tag"
                  :class="getCorrespondingTag('Open to anyone').class"
                >
                  {{ getCorrespondingTag('Open to anyone').tag }}
                </div> -->
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
                      <!-- {{ contract.opportunity_description | truncate }} -->
                      <div 
                        v-for="code in contract.nigp_codes"
                        :key="code"
                      >
                        NIGP Codes:<br>
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
                    <span v-if="contract.alternate_ids[0]"> (Alternate ID: {{ contract.alternate_ids[0] }})</span>
                    <br>
                    <b>Date posted: </b>
                    <span>{{ contract.open_bidding_begin_date | showDate }}</span>
                    <div class="see-more-link">
                      <a
                        v-if="contract.data_source == 'E-Contracts'"
                        target="_blank" 
                        :href="'https://philawx.phila.gov/econtract/default.aspx?LinkOppID=' + contract.bid_number"
                      >
                        View details in eContractPhilly
                      </a>
                      <a
                        v-if="contract.data_source == 'PHL-Contracts'"
                        target="_blank" 
                        :href="'https://www.phlcontracts.phila.gov/bso/external/bidDetail.sdo?bidId=' + contract.bid_number + '&parentUrl=activeBids'"
                      >
                        View details in PHL Contracts
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </paginate>
        
            <div
            
              class="pagination-tabs"
            >
              <paginate-links
                v-show="contracts.length > 0"
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
    <modal
      class="disclaimer-modal"
      name="howToUseModal"
      adaptive
      height="auto"
    >
      <div>
        <h2>How to use Contracts Hub</h2>
        <button
          class="hide-modal-btn"
          @click="$modal.hide('howToUseModal')"
        >
          <i class="fal fa-times" />
        </button>
      </div>
      <p>
        Contracts Hub helps you search multiple procurement websites at once.
        <br>
        <br>
        <b>Search for contracts</b>
        <br>
        You can search contracts by contract title, keyword, department, or NIGP code. You can filter results by contract type, estimated size, solicitation type, and competition. 
        <br>
        <br>
        <b>View contract details</b>
        <br>
        To view contract details, follow the link at the bottom of the contract listing. The link will take you to the procurement website that hosts the contract. Before you can take action -- like placing a bid -- you'll need to log in.
        <br>
        <br>
        <b>Log in to apply for a contract</b>
        <br>
        RFPs are hosted on eContract Philly, while bid opportunities are hosted on PHLContracts. Use these links to log in or register for a new account.
        <br>
        <a
          target="_blank"
          href="https://philawx.phila.gov/econtract/"
        >Log in to eContract Philly</a>
        <br>
        <a
          target="_blank"
          href="https://www.phlcontracts.phila.gov/bso/"
        >Log in to PHLContracts</a>
      </p>
      <div>
        <input
          type="button"         
          value="Explore opportunities"
          class="continue-button button"
          @click="$modal.hide('howToUseModal')"
        >
      </div>
    </modal>
    <AppFooter />
  </div>
</template>

<script>
import moment from "moment";
import axios from "axios";
import ContractFilters from "./ContractFilters.vue";
import AppFooter from './AppFooter.vue';
import VuePaginate from 'vue-paginate';
import Vue from "vue";
import VueFuse from "vue-fuse";
import VueAnalytics from "vue-analytics";
import VModal from 'vue-js-modal';

// Vue.use(VModal); do i need this for mobile?
Vue.use(VuePaginate);
Vue.use(VueFuse);

/**
* @desc google analytics, only enabled in production
*/
Vue.use(VueAnalytics, {
  id: 'UA-860026-1',
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    sendHitTask: process.env.NODE_ENV === 'production',
  },
});

const endpoint =
    "https://phl.carto.com/api/v2/sql?q=select+*+from+contract_opportunities";

export default {
  name: "ContractsHub",
  components: {
    ContractFilters,
    AppFooter,
  },

  filters: {
    showDate: function(num) {
      return moment(num).format("MMMM D, YYYY h:mm A");
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
      allContracts: [],
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
        label: "Invitation to bid",
        sublabel: "Awarded to lowest-qualified bidder",
        matchKey: "solicitation",
        matchValue: "IFB",
        valueStore: "solicitation",
      },
      {
        label: "Request for proposals",
        sublabel: "Evaluated under <a href='https://www.phila.gov/documents/best-value-guidelines/'> best value guidelines</a>",
        matchKey: "solicitation",
        matchValue: "RFP",
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
        label: "Services, supplies, and equipment (SS&E)",
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
        "Date posted",
      ],
      searchOptions: {
        shouldSort: false, 
        threshold: 0.4, 
        keys: [
          'contract_category',
          'nigp_codes',
          'display_title',
          'opportunity_description',
          'solicitation_type',
          'department',
          'bid_number',
          'type_code',
          'contract_category',
        ],
      },
    };
  },
  computed: {
    showNum: function() {
      if (this.contracts.length === this.allContracts.length) {
        return `<p>Showing all ${this.contracts.length} available opporunities.</p>`;
      }  else  
      if (this.contracts.length === 0) {
        return '<p>No opportunities found. Try adjusting your filters or search entry.</p>';
      } 
      return `<p>Showing ${this.contracts.length} out of ${this.allContracts.length} opportunities.</p>`;
    },
  },

  watch: {
    search () {
      this.searchContracts();
    },
  },
  mounted: function() {
    this.getAllContracts();
  },
  methods: {
    getAllContracts: function() {
      axios.get(endpoint).then(response => {
        this.allContracts = response.data.rows;
        this.allContracts.forEach((contract)=>{
          if (contract.data_source == "PHL-Contracts") {
            contract.display_title = contract.opportunity_description;
            contract.url = 'https://www.phlcontracts.phila.gov/bso/external/bidDetail.sdo?bidId=' + contract.bid_number + '&parentUrl=activeBids';

            contract.solicitation_type = "BID";
            if (contract.contract_category == "Best Value" || contract.contract_category == "Request for Information") {
              contract.solicitation_type = "RFP";
              contract.contract_category = "Services, Supplies, and Equipment";
            }
          } else if (contract.data_source == "E-Contracts") {
            contract.display_title = contract.type_code + " contract for "+  contract.department;
            contract.url = 'https://philawx.phila.gov/econtract/default.aspx?LinkOppID=' + contract.bid_number;
            contract.solicitation_type = "RFP";
          }
        });
        this.sortContracts();
      }).then(()=>{
        this.contracts = this.allContracts;
      })
        .catch(e=> {
          window.console.log(e);
        });
    },

    clearAllFilters: function() {
      this.search = "";
    },

    updateResultsList: function() {
      return;
    },

    sortContracts: function() {

      switch (this.sort) {
      case 'Responses due':
        
        this.allContracts.sort((a, b) => {
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
        this.allContracts.sort((a, b) => {
          if (a.display_title.toUpperCase() < b.display_title.toUpperCase()) {
            return -1;
          }
          if (a.display_title.toUpperCase() > b.display_title.toUpperCase()) {
            return 1;
          }
          return 0;
        });
        break;
      
      case 'Department':
        this.allContracts.sort((a, b) => {
          if (a.department < b.department) {
            return -1;
          }
          if (a.department > b.department) {
            return 1;
          }
          return 0;
        });
        break;
      
      case 'Date posted':
        this.allContracts.sort((a, b) => {
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
      //
      return;
    },

    searchContracts: function() {
      if (this.search) { // there is nothing in the search bar -> return everything in filteredPosts
        // this.contracts = [];
        this.$search(this.search, this.allContracts, this.searchOptions).then(contracts => {
          this.contracts = contracts;
        });

      } else {
        this.contracts = this.allContracts;

      }
    },

    getAmountTag(num) {
      if (num > 100000) {
        return {
          tag: "Over 100k",
          class: "bg-yellow color-grey",
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
            class: "bg-services-blue color-grey",
          };
        case "RFP":
          return {
            tag: "RFP",
            class: "bg-brown color-white",
          };
        case "BID":
          return {
            tag: "BID",
            class: "bg-orange color-grey",
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
          return{
            tag: tag,
            class: "",
          };
        }
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style  lang="scss">
.main {
    width: 80rem;
    margin: 0 auto;
    
}

main {
  margin-bottom: 50px;
}

.intro-text {
    margin: 3rem 0;
}

.clear-search-btn {
  position: absolute;
  top: 16px;
  right: 70px;
  padding: 0;
  font-size: 20px;
  background-color: #fff;
  opacity: 0.8;
  z-index: 999;
  cursor: pointer;
  color: rgba(60, 60, 60, 0.5);
  &:hover {
    background: transparent;
    color: black;
  }
}

.contract-header {
    /* padding-top: 5px; */
    line-height: 1.5;
    padding: 2px 10px;
    background-color: #a1a1a1;
    margin: 3px 2px;
    font-weight: 700;
    color: #0f4d90;
    
    font-size: 20px;
    a {
      text-decoration: none !important;
    }
}

.contract-details{
  width: 95%;
  margin: 0 auto;
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
    margin-bottom: 100px;
}



.contract-tags {
    margin: 10px 0 15px;
    line-height: 1.1;
    display:flex;

    .contract-tag {
    display: inline-block;
    margin-right: 30px;
    line-height: 1;
    padding: 2px 10px;
    // background-color: #a1a1a1;
    margin: 3px 10px 3px 0px;
    font-weight: 700;
    // color: #fff;
    text-transform: uppercase;
    font-size: 12px;
}
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
    margin-bottom: 15px;
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

.search{
  margin-bottom: 3rem;
}
.post-disclaimer {
    margin-top: 10px;
    margin-left: 5px;
    // font-style: italic;
    font-size: 12px;
}

.sublabel {
    font-size: 12px;
    margin-left: 30px;
    margin-bottom: 10px;
}

.checkbox-wrap {
    margin-bottom: 5-px;
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
  color: black;
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

.bg-services-blue {
  background-color: #d6e9fb;
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
  display: block;
  margin-top: 3rem;
  float: right;
  text-decoration:underline;

}

a {
  text-decoration: underline !important;
}

ul li a {
  text-decoration: none!important;
}

.page-title {
  font-size: 2rem !important;
}

.site-header {
    position: sticky;
    position: -webkit-sticky;
    top: 0;
    z-index: 9000;

} 

.app-nav {
    position: sticky;
    top: 73px;
    z-index: 9000;

}

.page-title-container a{
    text-decoration: none !important;
}

#demo-badge {
    white-space: nowrap;
    height: 22px;
    width: 48px;
    text-align: center;
    line-height: 1.5rem;
    display: inline-block;
    font-size: 12px;
    font-family: Arial,Helvetica,sans-serif;
    font-weight: 800;
    vertical-align: middle;
    margin-left: 8px;
    border-radius: 1px;
    color: #000;
    background: #ff8d00;
}

.disclaimer-modal {
  .vm--modal {
    padding: 20px;
  
  }
  .hide-modal-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 0;
    font-size: 20px;
    background-color: #fff;
    opacity: 0.8;
    z-index: 999;
    cursor: pointer;
    &:hover {
      color: #444;
    }
  }

  .continue-button {
    float: right;
  }
}

</style>
