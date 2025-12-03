export function add(a: number, b: number): number {
    return a+b;
}


export function helloUser(userName: string): string {

const greeting = Math.random();
if (greeting < 0.5) {
    return "Hello, " + userName;
}
else {
    return "Привет, " + userName;
}
}
