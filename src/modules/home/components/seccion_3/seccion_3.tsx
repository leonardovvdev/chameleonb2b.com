import style from "./seccion_3.module.css"

const Seccion_3 = () => {

    const handleRedirect = () => {
        window.open("https://ferreteriagorrioncito-one.vercel.app/", "_blank");
    };

    return (
        <div className={style.seccion}>
            <div
                className={style.distribuidora_ferretera_gorrioncito}
                onClick={handleRedirect}
                style={{ cursor: "pointer" }}
            >
                <span className={style.titulo}>Distribuidora Ferretera Gorrioncito</span>
                <div className={style.gorrioncito}>
                    <div className={style.imagen}>
                        <img src="./gorrioncito_ubicacion.png" alt="Ferretería Gorrioncito" />
                    </div>
                    <p>
                        En nuestra ferretería encontrarás todo lo que necesitas para tus proyectos de
                        construcción, reparación y mantenimiento, con productos de calidad, precios
                        competitivos y una atención pensada para ayudarte a encontrar exactamente lo que
                        buscas. Visítanos y recibe asesoría para elegir los materiales y herramientas
                        adecuados para cada trabajo. ¡Ven a nuestra ferretería y comprueba por qué
                        nuestros clientes nos eligen por confianza, calidad y buen servicio!
                    </p>
                </div>
            </div>
            <div className={style.ferreteria_apolinario}>

            </div>

        </div>
    );
}
export default Seccion_3;