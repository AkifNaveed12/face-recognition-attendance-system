// import axios from "axios";

// const api = axios.create({
// baseURL: "http://127.0.0.1:8000",
// withCredentials: false,
// headers: {
//     "Content-Type": "application/json"
// }
// });

// export default api;


//wrking code.....
// import axios from "axios";

// const api = axios.create({
//     baseURL: "http://127.0.0.1:8000",
// });

// api.interceptors.request.use((config) => {
//     const token = localStorage.getItem("token");
// if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
// }
//     return config;
// });

// export default api;


// src/services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api", // 🔴 adjust ONLY if backend differs
headers: {
    "Content-Type": "application/json",
},
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
    config.headers.Authorization = `Bearer ${token}`;
}
    return config;
});

export default api;