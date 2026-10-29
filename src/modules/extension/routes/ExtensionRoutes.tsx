import { Route } from "react-router-dom";
import ExtensionPage from "../pages/ExtensionPage";

export default [
  <Route
    key="extensions"
    path="/extensions/:extnsName"
    element={<ExtensionPage />}
  />,
];