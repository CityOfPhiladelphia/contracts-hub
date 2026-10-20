// These tests were written with the help of AI. They were reviewed by the person who
// committed the code.

import { mount, shallowMount } from "@vue/test-utils";
import axios from "axios";
import moment from "moment";
import ContractsHub from "@/components/ContractsHub.vue";

jest.mock("axios");

const inDays = days => moment().add(days, "d").toISOString();

// Fresh objects each call, because the component mutates the rows it receives
const phlContract = (overrides = {}) => ({
  data_source: "PHL-Contracts",
  bid_number: "B100",
  opportunity_description: "Road salt",
  department: "Streets",
  type_code: "",
  estimated_amount: 50000,
  nigp_codes: [],
  bid_due_date: inDays(10),
  bid_post_date: inDays(-5),
  alternate_ids: "[]",
  ...overrides,
});

const eContract = (overrides = {}) => ({
  data_source: "E-Contracts",
  bid_number: "E200",
  opportunity_description: "Consulting",
  department: "Finance",
  type_code: "Professional Services",
  contract_category: "Professional Services",
  estimated_amount: 200000,
  bid_due_date: inDays(10),
  bid_post_date: inDays(-5),
  alternate_ids: "[]",
  ...overrides,
});

const flushPromises = () => new Promise(resolve => setTimeout(resolve));

async function mountWithRows(rows) {
  axios.get.mockResolvedValue({ data: { rows }});
  const wrapper = shallowMount(ContractsHub);
  await flushPromises();
  return wrapper;
}

// Renders the real paginate component and contract list, which shallowMount stubs out
async function renderWithRows(rows) {
  axios.get.mockResolvedValue({ data: { rows }});
  const wrapper = mount(ContractsHub, {
    stubs: [ "AppHeader", "AppFooter", "ContractFilters", "modal" ],
  });
  await flushPromises();
  return wrapper;
}

const contractByBid = (wrapper, bidNumber) =>
  wrapper.vm.allContracts.find(contract => contract.bid_number === bidNumber);

describe("ContractsHub", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("loading contracts", () => {
    it("requests contract opportunities from Carto", async () => {
      await mountWithRows([]);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("phl.carto.com/api/v2/sql"),
      );
    });

    it("hides contracts whose due date has passed", async () => {
      const wrapper = await mountWithRows([
        phlContract({ bid_number: "open", bid_due_date: inDays(3) }),
        phlContract({ bid_number: "expired", bid_due_date: inDays(-3) }),
      ]);
      expect(wrapper.vm.contracts.map(c => c.bid_number)).toEqual([ "open" ]);
    });

    it("logs the error and shows no contracts when the request fails", async () => {
      const log = jest.spyOn(window.console, "log").mockImplementation(() => {});
      axios.get.mockRejectedValue(new Error("network down"));
      const wrapper = shallowMount(ContractsHub);
      await flushPromises();
      expect(wrapper.vm.contracts).toEqual([]);
      expect(log).toHaveBeenCalled();
      log.mockRestore();
    });
  });

  describe("estimated amount buckets", () => {
    it.each([
      [ 33999, "sub34k" ],
      [ 34000, "34kto100k" ],
      [ 100000, "34kto100k" ],
      [ 100001, "100kplus" ],
    ])("puts %d in %s", async (amount, bucket) => {
      const wrapper = await mountWithRows([ phlContract({ estimated_amount: amount }) ]);
      expect(wrapper.vm.allContracts[0].display_amount).toBe(bucket);
    });

    it("leaves contracts without an amount unbucketed", async () => {
      const wrapper = await mountWithRows([ phlContract({ estimated_amount: null }) ]);
      expect(wrapper.vm.allContracts[0].display_amount).toBeUndefined();
    });
  });

  describe("PHLContracts rows", () => {
    it("uses the description as the title and links to the bid", async () => {
      const wrapper = await mountWithRows([ phlContract() ]);
      const contract = wrapper.vm.allContracts[0];
      expect(contract.display_title).toBe("Road salt");
      expect(contract.url).toBe(
        "https://www.phlcontracts.phila.gov/bso/external/bidDetail.sdo?bidId=B100&parentUrl=activeBids",
      );
    });

    it("treats contracts without a special type code as bids", async () => {
      const wrapper = await mountWithRows([ phlContract({ type_code: "XX" }) ]);
      expect(wrapper.vm.allContracts[0].solicitation_type).toBe("BID");
    });

    it.each([
      [ "BB", "Services, Supplies, and Equipment" ],
      [ "BP", "Public Works" ],
      [ "CR", "Concessions" ],
      [ "RI", "Services, Supplies, and Equipment" ],
    ])("maps type code %s to an RFP in %s", async (typeCode, category) => {
      const wrapper = await mountWithRows([ phlContract({ type_code: typeCode }) ]);
      const contract = wrapper.vm.allContracts[0];
      expect(contract.solicitation_type).toBe("RFP");
      expect(contract.contract_category).toBe(category);
    });

    describe("NIGP codes", () => {
      const describedCodes = [
        "005-05 - Abrasive Equipment and Tools",
        "005-14 - Abrasives, Coated: Cloth, Fiber, Sandpaper, etc.",
      ];

      it("describes codes given as an array", async () => {
        const wrapper = await mountWithRows([
          phlContract({ nigp_codes: [ "005-05", "005-14" ]}),
        ]);
        expect(wrapper.vm.allContracts[0].new_nigp_codes).toEqual(describedCodes);
      });

      it("describes codes given as a JSON string", async () => {
        const wrapper = await mountWithRows([
          phlContract({ nigp_codes: "[\"005-05\", \"005-14\"]" }),
        ]);
        expect(wrapper.vm.allContracts[0].new_nigp_codes).toEqual(describedCodes);
      });

      it("ignores a string that isn't valid JSON", async () => {
        const wrapper = await mountWithRows([ phlContract({ nigp_codes: "005-05, 005-14" }) ]);
        expect(wrapper.vm.allContracts[0].new_nigp_codes).toEqual([]);
      });

      it("skips codes that aren't in the NIGP list", async () => {
        const wrapper = await mountWithRows([
          phlContract({ nigp_codes: [ "005-05", "999-99" ]}),
        ]);
        expect(wrapper.vm.allContracts[0].new_nigp_codes).toEqual([ describedCodes[0] ]);
      });

      it("handles missing codes", async () => {
        const wrapper = await mountWithRows([ phlContract({ nigp_codes: null }) ]);
        expect(wrapper.vm.allContracts[0].new_nigp_codes).toEqual([]);
      });
    });
  });

  describe("alternate IDs", () => {
    it.each([
      [ "a JSON string", "[\"3976\"]", [ "3976" ]],
      [ "an array", [ "3976" ], [ "3976" ]],
      [ "an empty JSON list", "[]", []],
      [ "a string that isn't valid JSON", "3976", []],
      [ "missing", null, []],
    ])("reads alternate IDs given as %s", async (_, alternateIds, expected) => {
      const wrapper = await mountWithRows([ phlContract({ alternate_ids: alternateIds }) ]);
      expect(wrapper.vm.allContracts[0].alternate_ids).toEqual(expected);
    });

    it("shows the alternate ID only when there is one", async () => {
      const wrapper = await renderWithRows([
        phlContract({ bid_number: "with-id", alternate_ids: "[\"3976\"]" }),
        eContract({ bid_number: "without-id", alternate_ids: "[]" }),
      ]);
      const text = wrapper.findAll(".single-contract").wrappers.map(contract => contract.text());
      const withId = text.find(t => t.includes("with-id"));
      const withoutId = text.find(t => t.includes("without-id"));
      expect(withId).toContain("(Alternate ID: 3976)");
      expect(withoutId).not.toContain("Alternate ID");
      expect(contractByBid(wrapper, "with-id").alternate_ids).toEqual([ "3976" ]);
    });
  });

  describe("eContract Philly rows", () => {
    it("builds a title and link, and treats them as RFPs", async () => {
      const wrapper = await mountWithRows([ eContract() ]);
      const contract = wrapper.vm.allContracts[0];
      expect(contract.display_title).toBe("Professional Services contract for Finance");
      expect(contract.url).toBe(
        "https://philawx.phila.gov/econtract/default.aspx?LinkOppID=E200",
      );
      expect(contract.solicitation_type).toBe("RFP");
    });

    it("puts miscellaneous orders under $34,000 regardless of amount", async () => {
      const wrapper = await mountWithRows([
        eContract({ type_code: "Miscellaneous Order", estimated_amount: 500000 }),
      ]);
      expect(wrapper.vm.allContracts[0].display_amount).toBe("sub34k");
    });
  });

  describe("filtering", () => {
    let wrapper;

    beforeEach(async () => {
      wrapper = await mountWithRows([
        phlContract({ bid_number: "small-bid", estimated_amount: 1000 }),
        phlContract({ bid_number: "works-rfp", type_code: "BP", estimated_amount: 500000 }),
        eContract({ bid_number: "pro-rfp", estimated_amount: 50000 }),
      ]);
    });

    const shownBids = () => wrapper.vm.contracts.map(c => c.bid_number).sort();

    it("filters by solicitation type", async () => {
      wrapper.setData({ solicitation: [ "RFP" ]});
      await wrapper.vm.filterContracts();
      expect(shownBids()).toEqual([ "pro-rfp", "works-rfp" ]);
    });

    it("filters by size", async () => {
      wrapper.setData({ sizes: [ "sub34k", "34kto100k" ]});
      await wrapper.vm.filterContracts();
      expect(shownBids()).toEqual([ "pro-rfp", "small-bid" ]);
    });

    it("filters by contract type", async () => {
      wrapper.setData({ contracttypes: [ "Public Works" ]});
      await wrapper.vm.filterContracts();
      expect(shownBids()).toEqual([ "works-rfp" ]);
    });

    it("combines filters", async () => {
      wrapper.setData({ solicitation: [ "RFP" ], sizes: [ "100kplus" ]});
      await wrapper.vm.filterContracts();
      expect(shownBids()).toEqual([ "works-rfp" ]);
    });

    it("searches by keyword", async () => {
      wrapper.setData({ search: "Consulting" });
      await wrapper.vm.filterContracts();
      expect(shownBids()).toEqual([ "pro-rfp" ]);
    });

    it("clears every filter and the search", async () => {
      wrapper.setData({ search: "Consulting", solicitation: [ "RFP" ], sizes: [ "sub34k" ], contracttypes: [ "Public Works" ]});
      await wrapper.vm.clearAllFilters();
      await flushPromises();
      expect(wrapper.vm.search).toBe("");
      expect(wrapper.vm.solicitation).toEqual([]);
      expect(wrapper.vm.sizes).toEqual([]);
      expect(wrapper.vm.contracttypes).toEqual([]);
      expect(shownBids()).toEqual([ "pro-rfp", "small-bid", "works-rfp" ]);
    });

    describe("with expired contracts in the data", () => {
      beforeEach(async () => {
        wrapper = await mountWithRows([
          phlContract({ bid_number: "open" }),
          phlContract({ bid_number: "expired", bid_due_date: inDays(-3) }),
        ]);
      });

      it("counts only open contracts", () => {
        expect(wrapper.vm.showNum).toContain("Showing all 1 available opportunities");
      });

      it("keeps expired contracts hidden after filtering", async () => {
        await wrapper.vm.filterContracts();
        expect(shownBids()).toEqual([ "open" ]);
      });

      it("keeps expired contracts hidden after clearing filters", async () => {
        wrapper.setData({ sizes: [ "sub34k" ]});
        await wrapper.vm.filterContracts();
        await wrapper.vm.clearAllFilters();
        await flushPromises();
        expect(shownBids()).toEqual([ "open" ]);
      });
    });
  });

  describe("pagination", () => {
    let wrapper;

    beforeEach(async () => {
      wrapper = await renderWithRows(
        Array.from({ length: 12 }, (_, i) =>
          phlContract({ bid_number: `bid-${i}`, estimated_amount: 1000 }),
        ),
      );
    });

    const shownOnPage = () => wrapper.findAll(".single-contract").length;

    it("shows the first page of results", () => {
      expect(shownOnPage()).toBe(10);
    });

    it("shows results again after a filter that matched nothing", async () => {
      wrapper.setData({ sizes: [ "100kplus" ]});
      await wrapper.vm.filterContracts();
      await flushPromises();
      expect(shownOnPage()).toBe(0);

      wrapper.setData({ sizes: [ "sub34k" ]});
      await wrapper.vm.filterContracts();
      await flushPromises();
      expect(shownOnPage()).toBe(10);
    });

    it("goes back to the first page when the filters change", async () => {
      wrapper.vm.$refs.paginator.goToPage(2);
      await flushPromises();
      expect(shownOnPage()).toBe(2);

      wrapper.setData({ sizes: [ "sub34k" ]});
      await wrapper.vm.filterContracts();
      await flushPromises();
      expect(shownOnPage()).toBe(10);
    });
  });

  describe("sorting", () => {
    let wrapper;

    beforeEach(async () => {
      wrapper = await mountWithRows([
        phlContract({ bid_number: "a", opportunity_description: "beta", department: "Zoning", bid_due_date: inDays(2), bid_post_date: inDays(-1) }),
        phlContract({ bid_number: "b", opportunity_description: "Alpha", department: "Aviation", bid_due_date: inDays(9), bid_post_date: inDays(-9) }),
        phlContract({ bid_number: "c", opportunity_description: "Gamma", department: "Library", bid_due_date: inDays(5), bid_post_date: inDays(-5) }),
      ]);
    });

    const sortedBids = () => wrapper.vm.allContracts.map(c => c.bid_number);

    it("sorts by due date when the page loads", () => {
      expect(sortedBids()).toEqual([ "a", "c", "b" ]);
    });

    it.each([
      [ "Contract title", [ "b", "a", "c" ]],
      [ "Department", [ "b", "c", "a" ]],
      [ "Date posted", [ "b", "c", "a" ]],
      [ "Responses due", [ "a", "c", "b" ]],
    ])("sorts by %s", (sort, expected) => {
      wrapper.setData({ sort });
      wrapper.vm.sortContracts();
      expect(sortedBids()).toEqual(expected);
    });
  });

  describe("results count", () => {
    let wrapper;

    beforeEach(async () => {
      wrapper = await mountWithRows([
        phlContract({ bid_number: "a" }),
        phlContract({ bid_number: "b" }),
      ]);
    });

    it("says all opportunities are shown", () => {
      expect(wrapper.vm.showNum).toContain("Showing all 2 available opportunities");
    });

    it("says how many of the total are shown", () => {
      wrapper.setData({ contracts: [ wrapper.vm.allContracts[0] ]});
      expect(wrapper.vm.showNum).toContain("Showing 1 out of 2 opportunities");
    });

    it("says when nothing matches", () => {
      wrapper.setData({ contracts: []});
      expect(wrapper.vm.showNum).toContain("No opportunities found");
    });
  });

  describe("tags", () => {
    let wrapper;

    beforeEach(async () => {
      wrapper = await mountWithRows([]);
    });

    it.each([
      [ "Professional Services", "Pro services" ],
      [ "Services, Supplies, and Equipment", "SS&E" ],
      [ "RFP", "RFP" ],
      [ "sub34k", "under 34k" ],
      [ "100kplus", "over 100k" ],
    ])("labels %s as %s", (value, label) => {
      expect(wrapper.vm.getCorrespondingTag(value).tag).toBe(label);
    });

    it("falls back to the value itself with no styling", () => {
      expect(wrapper.vm.getCorrespondingTag("Something new")).toEqual({ tag: "Something new", class: "" });
    });
  });

  describe("display filters", () => {
    const { truncate, truncateMobile, showDate, showDateTime } = ContractsHub.filters;

    it("truncates long descriptions", () => {
      expect(truncate("a".repeat(501))).toBe("a".repeat(500) + "...");
      expect(truncate("a".repeat(500))).toBe("a".repeat(500));
      expect(truncateMobile("a".repeat(251))).toBe("a".repeat(250) + "...");
      expect(truncateMobile("a".repeat(250))).toBe("a".repeat(250));
    });

    it("formats dates in Philadelphia time during daylight saving", () => {
      expect(showDate("2026-07-04T16:00:00Z")).toBe("July 4, 2026");
      expect(showDateTime("2026-07-04T16:00:00Z")).toBe("July 4, 2026 12:00 pm");
    });

    it("formats dates in Philadelphia time during standard time", () => {
      expect(showDateTime("2026-01-15T17:00:00Z")).toBe("January 15, 2026 12:00 pm");
    });

    // eContract Philly deadlines are 5:00 pm Philadelphia time
    it.each([
      [ "2026-10-19T21:00:00Z", "October 19, 2026 5:00 pm" ],
      [ "2026-11-16T22:00:00Z", "November 16, 2026 5:00 pm" ],
    ])("shows the %s deadline as %s", (value, expected) => {
      expect(showDateTime(value)).toBe(expected);
    });

    // PHLContracts dates are midnight Philadelphia time
    it.each([
      [ "2026-10-14T04:00:00Z", "October 14, 2026" ],
      [ "2026-12-01T05:00:00Z", "December 1, 2026" ],
    ])("shows the %s date as %s", (value, expected) => {
      expect(showDate(value)).toBe(expected);
    });

    it("formats morning times", () => {
      expect(showDateTime("2026-03-02T14:30:00Z")).toBe("March 2, 2026 9:30 am");
    });
  });
});
