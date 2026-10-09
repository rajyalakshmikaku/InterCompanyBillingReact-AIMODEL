import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./ScreenMapping.css";
import {
  fetchRoles,
  fetchScreenlist,
  fetchRolewiseScreenlist,
  savemapping,
} from "../../redux/ScreenMappingSlice";
import alertify from "alertifyjs";
import HelpModal from "../../components/Common/HelpModal";
import HoloButton from "../../components/Common/HoloButton";
import { allRoutes } from "../../Layout/sidebarRoutes";

const normalizePath = (path) => (path || "").replace(/^\//, "").toLowerCase();

const orderScreensLikeSidebar = (screenList) => {
  const routeOrder = new Map(
    allRoutes.map((route, index) => [normalizePath(route.path), index]),
  );

  return [...screenList].sort((first, second) => {
    const firstIndex = routeOrder.get(normalizePath(first.screenName));
    const secondIndex = routeOrder.get(normalizePath(second.screenName));

    if (firstIndex === undefined && secondIndex === undefined) return 0;
    if (firstIndex === undefined) return 1;
    if (secondIndex === undefined) return -1;
    return firstIndex - secondIndex;
  });
};

const ScreenMapping = () => {
  const dispatch = useDispatch();
  const [showHelp, setShowHelp] = useState(false);
  const {
    roles,
    Screens: screens,
    rolewisescreens,
    loading,
    error,
  } = useSelector((state) => state.screenmapping);

  const orderedScreens = orderScreensLikeSidebar(screens);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchScreenlist());
    dispatch(fetchRolewiseScreenlist());
  }, [dispatch]);

  useEffect(() => {
    if (rolewisescreens) {
      console.log("RolewiseScreens:", rolewisescreens);
    }
  }, [rolewisescreens]);

  const [mapping, setMapping] = useState({});

  useEffect(() => {
    // Initialize mapping when screens, roles, or rolewisescreens change
    if (screens.length > 0 && roles.length > 0) {
      const initialMapping = {};

      screens.forEach((screen) => {
        initialMapping[screen.screenName] = {};
        roles.forEach((role) => {
          // Check if role-screen exists in rolewisescreens
          const isChecked = rolewisescreens.some(
            (rws) =>
              rws.screenName === screen.screenName &&
              rws.roleName === role.roleName,
          );
          initialMapping[screen.screenName][role.roleName] = isChecked;
        });
      });

      setMapping(initialMapping);
    }
  }, [screens, roles, rolewisescreens]);

  const [saving, setSaving] = useState(false);

  const handleSaveMapping = async () => {
    setSaving(true);

    try {
      let anyMappingSaved = false;

      for (const role of roles) {
        const selectedScreensForRole = [];

        for (const screen of orderedScreens) {
          if (mapping[screen.screenName]?.[role.roleName]) {
            selectedScreensForRole.push(screen.id);
          }
        }

        if (selectedScreensForRole.length === 0) continue;

        const payload = {
          roleId: role.id,
          screenIds: selectedScreensForRole,
        };

        const response = await dispatch(savemapping(payload)).unwrap();
        anyMappingSaved = true;
      }

      if (anyMappingSaved) {
        await dispatch(fetchRolewiseScreenlist()).unwrap();
        alertify.alert("Success", "Screens are mapped successfully.");
      } else {
        alertify.alert("Warning", "No changes to save.");
      }
    } catch (err) {
      console.error("Error saving mapping:", err);
      alertify.alert(err?.message || "Failed to save mapping.");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckboxChange = (screen, role) => {
    setMapping((prev) => ({
      ...prev,
      [screen]: {
        ...prev[screen],
        [role]: !prev[screen][role],
      },
    }));
  };

  function formatDisplayName(path) {
    if (!path) return "";

    // Remove leading slash
    let name = path.startsWith("/") ? path.slice(1) : path;

    // Insert spaces before uppercase letters (except the first char)
    name = name.replace(/([a-z])([A-Z])/g, "$1 $2");

    // Capitalize first letter of each word
    name = name.replace(/\b\w/g, (char) => char.toUpperCase());

    return name;
  }

  return (
    <>
      <div className="screenmappingtable-controls">
        <div className="list-header">
          <h2 className="screenmappingheading">User Management</h2>
          <HoloButton
            variant="secondary"
            size="md"
            onClick={() => setShowHelp(true)}
          >
            <i className="fas fa-question-circle"></i> Help
          </HoloButton>
        </div>

        <div className="table-wrapper">
          <table className="screenmappingtable">
            <thead>
              <tr>
                <th style={{ color: "black" }}>SCREEN NAMES</th>
                {roles.map((role) => (
                  <th key={role.id}>{role.roleName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={roles.length + 1}
                    style={{ textAlign: "center", padding: "30px" }}
                  >
                   
                    <div style={{ marginTop: "10px" }}>
                      Loading screens...
                    </div>
                  </td>
                </tr>
              ) : orderedScreens.length > 0 ? (
                orderedScreens.map((screen) => (
                  <tr key={screen.id}>
                    <td>{screen.display}</td>

                    <td hidden>{screen.screenName}</td>

                    {roles.map((role) => (
                      <td key={role.id}>
                        <input
                          type="checkbox"
                          checked={
                            mapping[screen.screenName]?.[role.roleName] || false
                          }
                          onChange={() =>
                            handleCheckboxChange(
                              screen.screenName,
                              role.roleName
                            )
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={roles.length + 1}
                    style={{ textAlign: "center", padding: "30px" }}
                  >
                    No screens found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <HoloButton
            variant="primary"
            size="md"
            onClick={handleSaveMapping}
            disabled={saving}
          >
            <i className="fas fa-save"></i>{" "}
            {saving && <span className="spinner" />} Save Mapping
          </HoloButton>
        </div>
      </div>
      <HelpModal
        show={showHelp}
        title="User Management - Help & Overview"
        screenName="UserManagement"
        onClose={() => setShowHelp(false)}
      />
    </>
  );
};

export default ScreenMapping;
