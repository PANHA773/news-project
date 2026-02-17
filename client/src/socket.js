import { io } from "socket.io-client";
import { API_ORIGIN } from "./config/urls";

const socket = io(API_ORIGIN);

export default socket;
