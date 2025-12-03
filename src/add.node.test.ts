import { add } from "./add";
import { helloUser } from "./add";
describe("add funk", () => {
    test("+ and +", () => {
        expect(add(2,3)).toBe(5);
    });


    test("+ and -", () => {
        expect(add(2,-5)).toBe(-3);
    });


    test("- and -", () => {
        expect(add(-2,-5)).toBe(-7);
    });

    test("0 and +", () => {
        expect(add(0,5)).toBe(5);
    });

    test("fl and fl", () => {
        expect(add(0.1,0.2)).toBeCloseTo(0.3);
    });

});



describe("hellouser", () => {
    beforeEach(() => {
        jest.spyOn(Math, "random").mockRestore();
    });

    afterEach(() => {
        jest.spyOn(Math, "random").mockRestore();
    });

    test("simplegreeting", () => {
        const result = helloUser("Maria");
        expect(result).toContain("Maria");
    });

    test("hello or privet", () => {
       const result = helloUser("Maria"); 
        expect(result==="Hello, Maria" || result === "Привет, Maria").toBe(true);
    })
   
    test("mock for 3rd v", () => {
        jest.spyOn(Math, "random").mockReturnValue(0.3);
        const result = helloUser("Maria");
        expect(result).toBe("Hello, Maria");
    })

});
