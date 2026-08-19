import { useState } from "react";
import { loginApi } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpeg";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!username || !password) return;

        try {
            setLoading(true);

            const res = await loginApi({ username, password });

            localStorage.setItem("token", res.token);

            navigate("/");
        } catch (err) {
            alert("Invalid username or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-950">

            {/* 🌈 BACKGROUND BLUR ORBS */}
            <div className="absolute w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-30 top-10 left-10 animate-pulse"></div>
            <div className="absolute w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-30 bottom-10 right-10 animate-pulse"></div>

            {/* 🧊 LOGIN CARD */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl w-full max-w-md p-8 text-white animate-fadeIn">

                {/* HEADER */}
                <div className="text-center mb-6">

                    {/* LOGO ADDED HERE */}
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                            <img
                                src={logo}
                                alt="Karrali Logo"
                                className="h-10 w-10 object-contain"
                            />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold tracking-wide">
                        Karrali
                    </h1>

                    <p className="text-sm text-gray-300 mt-1">
                        Admin Control Panel
                    </p>
                </div>

                {/* INPUTS */}
                <div className="space-y-4">

                    <div>
                        <label className="text-xs text-gray-300">Username</label>
                        <input
                            type="text"
                            className="w-full mt-1 p-3 rounded-lg bg-white/10 border border-white/20 outline-none focus:ring-2 focus:ring-blue-400 transition"
                            placeholder="Enter username"
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-300">Password</label>
                        <input
                            type="password"
                            className="w-full mt-1 p-3 rounded-lg bg-white/10 border border-white/20 outline-none focus:ring-2 focus:ring-blue-400 transition"
                            placeholder="Enter password"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {/* BUTTON */}
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full mt-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition py-3 rounded-lg font-semibold shadow-lg"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </div>

                {/* FOOTER */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    Secure Admin Access Only
                </p>

            </div>

            {/* 🔥 ANIMATION STYLE */}
            <style>
                {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out;
          }
        `}
            </style>
        </div>
    );
}