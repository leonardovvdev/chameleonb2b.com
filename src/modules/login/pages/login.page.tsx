import Seccion_1 from "../components/seccion_1/seccion_1";
// import Seccion_2 from "../components/seccion_2/seccion_2";

// seccion_1 = fondo
// seccion_2 = login (entrar o crear cuenta)
export default function LoginPage() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      <Seccion_1 />
      {/* <Seccion_2 /> */}
    </div>
  );
}