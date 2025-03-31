import { useState, useEffect } from "react";
import { X, AlertTriangle, Search, Plus, Check, Trash2 } from "lucide-react";
import posthog from "posthog-js";
// import interactionsDatabase from "./assets/interactions";
// import medicationDatabase from "./assets/medications";

// Interfaces imported from external files
export interface RxData {
  RXCUI: string | null;
  GENERIC_RXCUI: string | null;
  TTY: string | null;
  FULL_NAME: string | null;
  RXN_DOSE_FORM: string | null;
  FULL_GENERIC_NAME: string | null;
  BRAND_NAME: string | null;
  DISPLAY_NAME: string | null;
  ROUTE: string | null;
  NEW_DOSE_FORM: string | null;
  STRENGTH: string | null;
  SUPPRESS_FOR: string | null;
  DISPLAY_NAME_SYNONYM: string | null;
  IS_RETIRED: string | null;
  SXDG_RXCUI: string | null;
  SXDG_TTY: string | null;
  SXDG_NAME: string | null;
  PSN?: string | null;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  interaction: string;
}

// Type definitions for the application
type Medication = {
  id: string;
  name: string;
  fullName: string;
  rxcui: string | null;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  prescribedDate: string;
};

type Interaction = {
  description: string;
  medications: string[];
};

posthog.init("phc_ccTcSrPxPH96PAGvcNKc9Mjmqv0lWAaYzYgiVijkCi5", {
  api_host: "https://us.i.posthog.com",
});

// Main App Component
const MedicationTracker = () => {
  const [patientName] = useState("Jane Doe");
  const [patientId] = useState("P123456789");
  const [interactionsDatabase, setInteractionsDatabase] = useState<
    DrugInteraction[]
  >([]);
  const [medicationDatabase, setMedicationDatabase] = useState<RxData[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMedications, setFilteredMedications] = useState<RxData[]>([]);
  const [filteredDosages, setFilteredDosages] = useState<{
    [key: string]: string[];
  }>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedication, setNewMedication] = useState<Partial<Medication>>({
    name: "",
    rxcui: null,
    dosage: "",
    frequency: "",
    prescribedBy: "",
    prescribedDate: "",
  });
  const [dosageSearchTerm, setDosageSearchTerm] = useState("");
  const [showDosageDropdown, setShowDosageDropdown] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [interactionsModule, medicationsModule] = await Promise.all([
          fetch(
            `https://pub-4157e937f3b34c29916c5f2460c3b0f9.r2.dev/interactions.json`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          ),
          fetch(
            `https://pub-4157e937f3b34c29916c5f2460c3b0f9.r2.dev/medications.json`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          ),
        ]);
        setInteractionsDatabase(JSON.parse(await interactionsModule.text()));

        setMedicationDatabase(JSON.parse(await medicationsModule.text()));
      } catch (error) {
        console.error("Error loading modules:", error);
      }
    }

    loadData();
  }, []);

  // Update interactions whenever medications change
  useEffect(() => {
    const getInteractionsFromDatabase = (): Interaction[] => {
      const result: Interaction[] = [];

      console.log("medications:", medications);
      for (const interaction of interactionsDatabase) {
        const drug1Exists = medications.some((med) => {
          if (
            med.fullName
              ?.toLowerCase()
              .includes(interaction.drug1.toLowerCase())
          ) {
            console.log("matched drug1:", med.fullName, interaction.drug1);
          }
          return med.fullName
            ?.toLowerCase()
            .includes(interaction.drug1.toLowerCase());
        });
        const drug2Exists = medications.some((med) => {
          if (
            med.fullName
              ?.toLowerCase()
              .includes(interaction.drug2.toLowerCase())
          ) {
            console.log("matched drug2:", interaction.drug2);
          }
          return med.fullName
            ?.toLowerCase()
            .includes(interaction.drug2.toLowerCase());
        });

        // Only add the interaction if both drugs are found in the medications array
        if (drug1Exists && drug2Exists) {
          console.log(
            "Found interaction:",
            interaction.drug1,
            interaction.drug2
          );
          result.push({
            description: interaction.interaction,
            medications: [interaction.drug1, interaction.drug2],
          });
        }
      }

      return result;
    };

    setInteractions(getInteractionsFromDatabase());
  }, [medications, interactionsDatabase]);

  // Filter medications based on search term
  useEffect(() => {
    if (searchTerm.length > 1 && medicationDatabase.length > 0) {
      const filtered = medicationDatabase.filter(
        (med) =>
          (med.DISPLAY_NAME &&
            med.DISPLAY_NAME.toLowerCase().includes(
              searchTerm.toLowerCase()
            )) ||
          (med.FULL_NAME &&
            med.FULL_NAME.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (med.BRAND_NAME &&
            med.BRAND_NAME.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      // Process dosages for unique medications
      const dosages: { [key: string]: string[] } = {};
      const filteredUniqueKeys: string[] = [];
      const filteredUnique: RxData[] = [];

      for (const med of filtered) {
        const displayName =
          med.DISPLAY_NAME || med.FULL_NAME || med.BRAND_NAME || "";

        if (!filteredUniqueKeys.includes(displayName)) {
          filteredUnique.push(med);
          filteredUniqueKeys.push(displayName);
          dosages[displayName] = [];
        }

        // Add strength to dosages if available and not already included
        if (med.STRENGTH && !dosages[displayName].includes(med.STRENGTH)) {
          dosages[displayName].push(med.STRENGTH);
        }
      }

      posthog.capture("medication_search", { search_term: searchTerm });

      setFilteredMedications(filteredUnique.slice(0, 10));
      setFilteredDosages(dosages);
    } else {
      setFilteredMedications([]);
    }
  }, [searchTerm, medicationDatabase]);

  // Add a new medication
  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage && newMedication.frequency) {
      const medicationToAdd: Medication = {
        id: Date.now().toString(),
        name: newMedication.name || "",
        fullName: newMedication.fullName || "",
        rxcui: newMedication.rxcui || null,
        dosage: newMedication.dosage || "",
        frequency: newMedication.frequency || "",
        prescribedBy: newMedication.prescribedBy || "Current Provider",
        prescribedDate:
          newMedication.prescribedDate ||
          new Date().toISOString().split("T")[0],
      };

      setMedications([...medications, medicationToAdd]);
      setNewMedication({
        name: "",
        rxcui: null,
        dosage: "",
        frequency: "",
        prescribedBy: "",
        prescribedDate: "",
      });
      setShowAddForm(false);
    }
  };

  // Remove a medication
  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter((med) => med.id !== id));
  };

  // Select a medication from the dropdown
  const handleSelectMedication = (med: RxData) => {
    const displayName =
      med.DISPLAY_NAME || med.FULL_NAME || med.BRAND_NAME || "";
    setNewMedication({
      ...newMedication,
      name: displayName,
      fullName: med.FULL_NAME || "",
      rxcui: med.RXCUI,
      dosage: med.STRENGTH || "",
    });
    setSearchTerm("");
    setFilteredMedications([]);
  };

  // Select a dosage from the dropdown
  const handleSelectDosage = (dosage: string) => {
    setNewMedication({
      ...newMedication,
      dosage: dosage,
    });
    setDosageSearchTerm("");
    setShowDosageDropdown(false);
  };

  console.log("interactions:", interactions);

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">MedTrack</h1>
            <p className="text-gray-500">Medication Interaction Tracker</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">{patientName}</h2>
            <p className="text-gray-500">Patient ID: {patientId}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medication List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Current Medications</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Medication
              </button>
            </div>

            {medications.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No medications added yet
              </div>
            ) : (
              <div className="space-y-4">
                {medications.map((med) => (
                  <div
                    key={med.id}
                    className="border rounded-md p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-indigo-700">
                          {med.name}
                        </h3>
                        <p className="text-gray-700">
                          {med.dosage} • {med.frequency}
                        </p>
                        <p className="text-sm text-gray-500">
                          Prescribed by {med.prescribedBy} on{" "}
                          {new Date(med.prescribedDate).toLocaleDateString()}
                        </p>
                        {med.rxcui && (
                          <p className="text-xs text-gray-400 mt-1">
                            RXCUI: {med.rxcui}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveMedication(med.id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Remove medication"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Interactions Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Potential Interactions
            </h2>

            {interactions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No interactions detected
              </div>
            ) : (
              <div className="space-y-4">
                {interactions.map((interaction, index) => (
                  <div
                    key={index}
                    className={`border rounded-md p-4 border-blue-200 bg-blue-50`}
                  >
                    <div className="flex items-start">
                      <AlertTriangle className={`w-5 h-5 mr-2 text-blue-500`} />
                      <div>
                        <p className="text-gray-700 text-sm">
                          {interaction.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {interaction.medications.map((med) => (
                            <span
                              key={med}
                              className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700"
                            >
                              {med}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Medication Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Medication</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Medication Name with Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={newMedication.name || searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setNewMedication({
                        ...newMedication,
                        name: e.target.value,
                        rxcui: null,
                      });
                    }}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Search for medication..."
                  />
                </div>

                {/* Search Results Dropdown */}
                {filteredMedications.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-w-md bg-white shadow-lg rounded-md py-1 text-base overflow-auto max-h-60">
                    {filteredMedications.map((med) => (
                      <div
                        key={med.RXCUI}
                        onClick={() => handleSelectMedication(med)}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 flex items-center"
                      >
                        {med.DISPLAY_NAME || med.FULL_NAME || med.BRAND_NAME}
                        {med.RXCUI === newMedication.rxcui && (
                          <Check className="w-4 h-4 ml-2 text-green-500" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dosage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newMedication.dosage || dosageSearchTerm}
                    onChange={(e) => {
                      setDosageSearchTerm(e.target.value);
                      setNewMedication({
                        ...newMedication,
                        dosage: e.target.value,
                      });
                      setShowDosageDropdown(true);
                    }}
                    onClick={() => {
                      if (
                        filteredDosages[newMedication.name || ""] &&
                        filteredDosages[newMedication.name || ""].length > 0
                      ) {
                        setShowDosageDropdown(true);
                      }
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter or select dosage"
                  />
                </div>

                {/* Dosage Dropdown */}
                {showDosageDropdown &&
                  filteredDosages[newMedication.name || ""] &&
                  filteredDosages[newMedication.name || ""].length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-w-md bg-white shadow-lg rounded-md py-1 text-base overflow-auto max-h-60">
                      {filteredDosages[newMedication.name || ""].map(
                        (dosage, index) => (
                          <div
                            key={index}
                            onClick={() => handleSelectDosage(dosage)}
                            className="cursor-pointer px-4 py-2 hover:bg-gray-100 flex items-center"
                          >
                            {dosage}
                            {dosage === newMedication.dosage && (
                              <Check className="w-4 h-4 ml-2 text-green-500" />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={newMedication.frequency || ""}
                  onChange={(e) =>
                    setNewMedication({
                      ...newMedication,
                      frequency: e.target.value,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select frequency...</option>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Four times daily">Four times daily</option>
                  <option value="As needed">As needed</option>
                  <option value="Every other day">Every other day</option>
                  <option value="Once weekly">Once weekly</option>
                  <option value="Bedtime only">Bedtime only</option>
                </select>
              </div>

              {/* Prescribed By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prescribed By
                </label>
                <input
                  type="text"
                  value={newMedication.prescribedBy || ""}
                  onChange={(e) =>
                    setNewMedication({
                      ...newMedication,
                      prescribedBy: e.target.value,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Dr. Smith"
                />
              </div>

              {/* Prescribed Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prescribed Date
                </label>
                <input
                  type="date"
                  value={newMedication.prescribedDate || ""}
                  onChange={(e) =>
                    setNewMedication({
                      ...newMedication,
                      prescribedDate: e.target.value,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMedication}
                  disabled={
                    !newMedication.name ||
                    !newMedication.dosage ||
                    !newMedication.frequency
                  }
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                  Add Medication
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationTracker;
