import { equal } from "assert";
import testing_a_test from "../../routes/testing_a_test.ts";

describe("Typescript usage suite", () => {
  it("should be able to execute a test", () => {
    equal(true, true);
  });
  it("should return expected string", () => {
    equal(testing_a_test("incoming-text"), "incoming-text-static");
  });
});