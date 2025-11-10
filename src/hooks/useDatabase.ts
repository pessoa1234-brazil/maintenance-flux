import { useState } from "react";
import { Database } from "@/types";
import { initialDatabase } from "@/data/mockData";

export const useDatabase = () => {
  const [db, setDb] = useState<Database>(initialDatabase);

  const updateDatabase = (updater: (prevDb: Database) => Database) => {
    setDb(updater);
  };

  return { db, updateDatabase };
};
