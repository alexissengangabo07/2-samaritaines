import API from "./axios";

export const getDependantsByAbonne = (abonneId) =>
  API.get(`/dependants/abonne/${abonneId}`);
export const createDependant = (data) => API.post("/dependants", data);
export const updateDependant = (id, data) => API.put(`/dependants/${id}`, data);
export const deleteDependant = (id) => API.delete(`/dependants/${id}`);
