import PeopleSelect from "./formComponents/PeopleSelect";
import ReservationReason from "./formComponents/ReservationReason";
import DeviceList from "./formComponents/deviceList/DeviceList";
import Comments from "./formComponents/Comments";
import DatePicker from "./formComponents/datePicker/DatePicker";
import dayjs from "dayjs";
import { getHardware, getSala, createReservation } from "../../api/apihelper";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";

import "tailwindcss/tailwind.css";
import "./styles/Form.css";
import "./styles/styles.css";

function Form() {
  const { id } = useParams();
  const [sala, setSala] = useState({});
  const [horaSeleccionada, setHoraSeleccionada] = useState("9:00am - 10:00am");
  const [diaSeleccionado, setDiaSeleccionado] = useState(dayjs());
  const [people, setPeople] = useState([{ name: "", registration: "" }]);
  const [razonSeleccionada, setRazonSeleccionada] = useState(
    "Unidad de Formacion",
  );
  const [aparatos, setAparatos] = useState([]);
  const [comment, setComment] = useState("");

  // GET Sala by id
  useEffect(() => {
    getSala(id).then((sala) => {
      setSala(sala[0]);
    });
  }, [id]);

  // GET Hardware
  useEffect(() => {
    getHardware().then((hardware) => {
      setAparatos([]);
      hardware.map((hardware) => {
        setAparatos((prev) => [
          ...prev,
          { id: hardware.HardwareID, nombre: hardware.Nombre, cantidad: 0 },
        ]);
      });
    });
  }, [id]);

  // Send email
  const sendEmail = (nuevaReserva) => {
    console.log(nuevaReserva);

    emailjs
      .send(
        "service_c15c1tk",
        "template_iddq57v",
        {
          // Aquí mapeas las propiedades del objeto Reserva a los nombres de los campos en tu plantilla de EmailJS
          Matricula: nuevaReserva.Matricula,
          Nombre: nuevaReserva.Alumnos[0].Nombre,
          NombreSala: sala.Nombre,
          SalaID: nuevaReserva.ZonaId,
          HoraInicio: nuevaReserva.HoraInicio,
          HoraFin: nuevaReserva.HoraFin,
          Proposito: nuevaReserva.Proposito,
          Estado: nuevaReserva.Estado,
          Alumnos: JSON.stringify(nuevaReserva.Alumnos),
          Hardware: aparatos
            .filter((ap) => ap.cantidad > 0)
            .map((ap) => `${ap.nombre}: ${ap.cantidad}`)
            .join(", "),
          Comentario: nuevaReserva.Comentario,
        },
        "X1RfWmMKzzLOL26XF",
      )
      .then(
        () => {
          console.log("SUCCESS!");
        },
        (error) => {
          console.log("FAILED...", error);
        },
      );
  };

  // POST Reserva
  const enviar = () => {
    const parseHour = (hour) => {
      const [time, period] = hour.split(" ");
      const [hours] = time.split(":");
      return period === "pm" ? parseInt(hours) + 12 : parseInt(hours);
    };

    const fechaInicio = dayjs(diaSeleccionado)
      .hour(parseHour(horaSeleccionada.split(" - ")[0]))
      .minute(0);
    const fechaFin = dayjs(diaSeleccionado)
      .hour(parseHour(horaSeleccionada.split(" - ")[1]))
      .minute(0);

    const nuevaReserva = {
      ZonaID: sala.SalaId,
      HoraInicio: fechaInicio.toISOString(),
      HoraFin: fechaFin.toISOString(),
      Proposito: razonSeleccionada,
      Estado: "Pendiente",
      Alumnos: people.map((persona) => ({
        Matricula: persona.registration,
        Nombre: persona.name,
      })),
      Matricula: people[0].registration,
      Hardware: aparatos
        .filter((ap) => ap.cantidad > 0)
        .map((ap) => ({
          HardwareID: ap.id,
          Cantidad: ap.cantidad,
        })),
      Comentario: comment,
    };

    console.log(nuevaReserva);

    // POST request with Axios
    createReservation(nuevaReserva).then((response) => {
      console.log(response);
      sendEmail(nuevaReserva);
    });
  };

  return (
    <div className="flex justify-center bg-black">
      <div className="form-container my-5 w-fit overflow-auto rounded-xl">
        <img src={`${sala.Link}.png`} className="h-72 w-full object-cover " />
        <div className="px-28 py-14 ">
          <h1 className="bh-text-blue ml-4 text-5xl font-bold">
            {sala.Nombre}
          </h1>
          <DatePicker
            horaSeleccionada={horaSeleccionada}
            setHoraSeleccionada={setHoraSeleccionada}
            diaSeleccionado={diaSeleccionado}
            setDiaSeleccionado={setDiaSeleccionado}
          />
          <PeopleSelect people={people} setPeople={setPeople} />
          <ReservationReason
            razonSeleccionada={razonSeleccionada}
            setRazonSeleccionada={setRazonSeleccionada}
          />
          <DeviceList aparatos={aparatos} setAparatos={setAparatos} />
          <Comments comment={comment} setComment={setComment} />
          <div className="mt-10 flex w-full justify-center gap-10">
            <button
              onClick={enviar}
              className="bh-bg-blue align-center flex justify-center self-center rounded-lg px-4 py-2 font-bold text-white"
            >
              Enviar
            </button>

            <Link to={"/BighornSheep"}>
              <button className="bh-border-blue bh-text-blue align-center flex justify-center self-center rounded-lg border-2 px-4 py-2 font-bold">
                Cancelar
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Form;
