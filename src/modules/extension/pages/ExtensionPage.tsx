import { useParams } from "react-router-dom";
import Seccion_1 from "../components/seccion_1/seccion_1";
// import Seccion_2 from "../components/seccion_2/seccion_2";
// import Seccion_3 from "../components/seccion_3/seccion_3";

export default function BuildingPage() {
  const { extnsName } = useParams<{ extnsName: string }>();

  return (
    <div>
      <Seccion_1 extnsName={extnsName ? decodeURIComponent(extnsName) : ""} />
      {/* <Seccion_2/>
      <Seccion_3/> */}
    </div>
  );
}