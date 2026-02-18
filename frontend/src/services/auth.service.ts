// import api from "./api";

// export async function login(student_id: string, password: string) {
//     const res = await api.post("/auth/login", {
//         student_id,
//         password
//     });
//     localStorage.setItem("token", res.data.access_token);
// }

// export async function getMe() {
//     const res = await api.get("/auth/me");
//     return res.data;
// }

import api from "./api";

export async function login(username: string, password: string) {
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

const res = await api.post("/auth/login", body, {
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
    },
});

localStorage.setItem("token", res.data.access_token);
}

export async function getMe() {
    const res = await api.get("/auth/me");
    return res.data;
}