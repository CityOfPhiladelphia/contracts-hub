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
            :filter-contracts="filterContracts"
            :clear-all-filters="clearAllFilters"
            :contracttypes.sync="contracttypes"
            :sizes.sync="sizes"
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
                
                <div class="contract-tags">
                  <div
                    v-if="contract.contract_category && contract.contract_category !== null "
                    class="contract-tag"
                    :class="getCorrespondingTag(contract.contract_category).class"
                  >
                    {{ getCorrespondingTag(contract.contract_category).tag }}
                  </div>
              
                  <div
                    v-if="contract.display_amount && contract.display_amount !== null"
                    class="contract-tag"
                    :class="getCorrespondingTag(contract.display_amount).class"
                  >
                    {{ getCorrespondingTag(contract.display_amount).tag }}
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
                <div class="contract-details">
                  <div class="description">
                    <div 
                      v-if="contract.data_source == 'E-Contracts'"
                    >
                      {{ contract.opportunity_description | truncate }}
                    </div>
                    <div 
                      v-if="contract.data_source == 'PHL-Contracts' && contract.new_nigp_codes.length > 0"
                    >
                      <!-- {{ contract.opportunity_description | truncate }} -->
                      NIGP codes:
                      <div 
                        v-for="code in contract.new_nigp_codes"
                        :key="code"
                      >
                        {{ code }}
                      </div>
                    </div>
                  </div>
                  <div class="last-data">
                    <br>
                    <b>Responses due: </b>
                    <span>{{ contract.bid_due_date | showDate }} </span>
                    <br>
                    <b>Posted by: </b>
                    <span>{{ contract.department }}</span>
                    <br>
                    <b>Number: </b>
                    <span>{{ contract.bid_number }}</span>
                    <span v-if="contract.alternate_ids[0]"> (Alternate ID: {{ contract.alternate_ids[0] }})</span>
                    <br>
                    <b>Date posted: </b>
                    <span>{{ contract.bid_post_date | showDate }}</span>
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

import nigpCodes from "../assets/nigp-codes.json";


Vue.use(VModal);
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
      return moment(num).zone(0).format("MMMM D, YYYY h:mm a");
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
      nigpArray: nigpCodes,

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
        matchKey: "solicitation_type",
        matchValue: "BID",
        valueStore: "solicitation_type",
      },
      {
        label: "Request for proposals",
        sublabel: "Evaluated under <a href='https://www.phila.gov/documents/best-value-guidelines/'> best value guidelines</a>",
        matchKey: "solicitation_type",
        matchValue: "RFP",
        valueStore: "solicitation_type",
      },
      
      ],
      sizes: [],
      sizeFilters: [{
        label: "Under $34,000",
        matchKey: "display_amount",
        matchValue: "sub34k",
        valueStore: "sizes",
      },
      {
        label: "$34,000 - $100,000",
        matchKey: "display_amount",
        matchValue: "34kto100k",
        valueStore: "sizes",
      },
      {
        label: "Over $100,000",
        matchKey: "display_amount",
        matchValue: "100kplus",
        valueStore: "sizes",
      },
      ],
      contracttypes: [],
      contractTypeFilters: [{
        label: "Concessions",
        matchKey: "contract_category",
        matchValue: "Concessions",
        valueStore: "contracttypes",
      },
      {
        label: "Personal and professional services",
        matchKey: "contract_category",
        matchValue: "Professional Services",
        valueStore: "contracttypes",
      },
      {
        label: "Public works",
        matchKey: "contract_category",
        matchValue: "Public Works",
        valueStore: "contracttypes",
      },
      {
        label: "Services, supplies, and equipment (SS&E)",
        matchKey: "contract_category",
        matchValue: "Services, Supplies, and Equipment",
        valueStore: "contracttypes",
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
        return `<p>Showing all ${this.contracts.length} available opportunities.</p>`;
      }  else  
      if (this.contracts.length === 0) {
        return '<p>No opportunities found. Try adjusting your filters or search entry.</p>';
      } 
      return `<p>Showing ${this.contracts.length} out of ${this.allContracts.length} opportunities.</p>`;
    },

  },

  watch: {
    search () {
      this.filterContracts();
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
          if(contract.estimated_amount) {
              
            let amount = contract.estimated_amount;
            if (amount > 100000) {
              contract.display_amount = "100kplus";

            } else if (34000 <= amount && amount <= 100000) {
              contract.display_amount = "34kto100k";
            } else if (amount < 34000) {
              contract.display_amount = "sub34k";
            }
          }
          if (contract.data_source == "PHL-Contracts") {
            contract.display_title = contract.opportunity_description;
            contract.url = 'https://www.phlcontracts.phila.gov/bso/external/bidDetail.sdo?bidId=' + contract.bid_number + '&parentUrl=activeBids';

            contract.solicitation_type = "BID";
            if (contract.contract_category == "Best Value" || contract.contract_category == "Request for Information") {
              contract.solicitation_type = "RFP";
              contract.contract_category = "Services, Supplies, and Equipment";
            }

            if (contract.nigp_codes && contract.nigp_codes.length > 0 ) {
              contract.new_nigp_codes = [];
              
              contract.nigp_codes.forEach(itemcode=> {
                let newCode = this.nigpArray.find(code => code.code == itemcode);
                if (newCode){
                  contract.new_nigp_codes.push(itemcode + " - " + newCode.item);
                }
              });
            
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


    sortContracts: function() {

      switch (this.sort) {
      case 'Responses due':
        
        this.allContracts.sort((a, b) => {
          if (a.bid_due_date < b.bid_due_date) {
            return -1;
          }
          if (a.bid_due_date > b.bid_due_date) {
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
          if (a.bid_post_date < b.bid_post_date) {
            return -1;
          }
          if (a.bid_post_date > b.bid_post_date) {
            return 1;
          }
          return 0;
        });
        break;
        
      default:
        return;
        
      }
    },

    filterContracts: async function() {
      let filteredContracts = await this.searchContracts(this.allContracts);
      let solicitationContracts = await this.solicitationFilter(filteredContracts);
      let sizeContracts = await this.sizeFilter(solicitationContracts);
      this.contracts = await this.categoryFilter(sizeContracts);

    },

    solicitationFilter: function(filteredContracts) {
      if (this.solicitation && this.solicitation.length > 0){
        let test = filteredContracts.filter(contract=> this.solicitation.includes(contract.solicitation_type));
        return test;
      } 
      return filteredContracts;
    },

    categoryFilter: function(filteredContracts) {
      if (this.contracttypes && this.contracttypes.length > 0){
        let test = filteredContracts.filter(contract=> this.contracttypes.includes(contract.contract_category));
        return test;
      } 
      return filteredContracts;
    },

    sizeFilter: function(filteredContracts) {
      if (this.sizes && this.sizes.length > 0){
        let test = filteredContracts.filter(contract=> this.sizes.includes(contract.display_amount));
        return test;
      } 
      return filteredContracts;
    },


    searchContracts: function(contracts) {
      if (this.search) { // there is nothing in the search bar -> return everything in filteredPosts
        return this.$search(this.search, contracts, this.searchOptions);
      } 
      return this.allContracts;
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
        case "sub34k":
          return {
            tag: "under 34k",
            class: "bg-vibrant-blue color-white",
          };
        case "34kto100k":
          return {
            tag: "34k - 100k",
            class: "bg-dark-green color-white",
          };
        case "100kplus":
          return {
            tag: "over 100k",
            class: "bg-yellow color-grey",
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
    padding: 0px 20px;
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
