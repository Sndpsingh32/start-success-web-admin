import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AdminCourses from "./pages/AdminCourses";
import AdminPlans from "./pages/AdminPlans";
import AdminCategories from "./pages/AdminCategories";
import AdminUsers from "./pages/AdminUsers";
import AdminKyc from "./pages/AdminKyc";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminBanners from "./pages/AdminBanners";
import AdminCoupons from "./pages/AdminCoupons";
import AdminSettings from "./pages/AdminSettings";
import AdminBroadcast from "./pages/AdminBroadcast";
import AdminReferralTree from "./pages/AdminReferralTree";
import AdminLandingHero from "./pages/AdminLandingHero";
import AdminReviews from "./pages/AdminReviews";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import RequireAuth from "./components/auth/RequireAuth";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Navigate to="/admin/courses" replace />} />
              <Route path="/dashboard" element={<Home />} />

              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/plans" element={<AdminPlans />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/kyc" element={<AdminKyc />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/admin/banners" element={<AdminBanners />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/broadcast" element={<AdminBroadcast />} />
              <Route path="/admin/tree/:id" element={<AdminReferralTree />} />
              <Route path="/admin/landing-hero" element={<AdminLandingHero />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />

              <Route path="/form-elements" element={<FormElements />} />
              <Route path="/basic-tables" element={<BasicTables />} />

              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
