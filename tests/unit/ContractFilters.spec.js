import { shallowMount } from "@vue/test-utils";
import ContractFilters from "@/components/ContractFilters.vue";

const mountFilters = (propsData = {}) =>
  shallowMount(ContractFilters, {
    propsData: {
      filterContracts: jest.fn(),
      clearAllFilters: jest.fn(),
      ...propsData,
    },
  });

const checkboxEvent = (value, checked) => ({ target: { value, checked }});

describe("ContractFilters", () => {
  it("knows when no filters are selected", () => {
    expect(mountFilters().vm.noneSelected).toBe(true);
    expect(mountFilters({ sizes: [ "sub34k" ]}).vm.noneSelected).toBe(false);
    expect(mountFilters({ contracttypes: [ "Concessions" ]}).vm.noneSelected).toBe(false);
    expect(mountFilters({ solicitation: [ "RFP" ]}).vm.noneSelected).toBe(false);
  });

  it("reports whether a filter value is checked", () => {
    const wrapper = mountFilters({ sizes: [ "sub34k" ]});
    expect(wrapper.vm.isFilterChecked("sub34k", "sizes")).toBe(true);
    expect(wrapper.vm.isFilterChecked("100kplus", "sizes")).toBe(false);
  });

  it("adds a checked value and refilters", () => {
    const wrapper = mountFilters({ sizes: [ "sub34k" ]});
    wrapper.vm.update("sizes", checkboxEvent("100kplus", true));
    expect(wrapper.emitted("update:sizes")[0][0]).toEqual([ "sub34k", "100kplus" ]);
    expect(wrapper.props("filterContracts")).toHaveBeenCalled();
  });

  it("doesn't add a value twice", () => {
    const wrapper = mountFilters({ sizes: [ "sub34k" ]});
    wrapper.vm.update("sizes", checkboxEvent("sub34k", true));
    expect(wrapper.emitted("update:sizes")[0][0]).toEqual([ "sub34k" ]);
  });

  it("removes an unchecked value and refilters", () => {
    const wrapper = mountFilters({ solicitation: [ "RFP", "BID" ]});
    wrapper.vm.update("solicitation", checkboxEvent("RFP", false));
    expect(wrapper.emitted("update:solicitation")[0][0]).toEqual([ "BID" ]);
    expect(wrapper.props("filterContracts")).toHaveBeenCalled();
  });
});
