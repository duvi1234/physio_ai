import api from "./api";

export const createNurse = (data) => {
  return api.post("/user/create-nurse", data);
};

export const createPhysio = (data) => {
  return api.post("/user/create-physio", data);
};
