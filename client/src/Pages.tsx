import React from "react";
import Welcome from "./pages/Welcome";

const Pages: React.FC = () => {
    return (
        <div className="page mobile-height max-w-screen-sm mx-auto py-8 px-4 overflow-y-auto">
            <Welcome />
        </div>
    )
};

export default Pages;