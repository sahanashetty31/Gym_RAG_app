import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MealLog from "./pages/MealLog";
import MealPlans from "./pages/MealPlans";
import Supplements from "./pages/Supplements";
import Recovery from "./pages/Recovery";
import CoachChat from "./pages/CoachChat";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/meals" element={<MealLog />} />
        <Route path="/meal-plans" element={<MealPlans />} />
        <Route path="/supplements" element={<Supplements />} />
        <Route path="/recovery" element={<Recovery />} />
        <Route path="/coach" element={<CoachChat />} />
      </Routes>
    </Layout>
  );
}

export default App;
