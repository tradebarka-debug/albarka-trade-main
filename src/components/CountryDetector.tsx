import { useEffect } from "react";

const CountryDetector = () => {
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(data => {
        let countryId = 1;

        switch (data.country_code) {
          case "BF":
            countryId = 1;
            break;

          case "CI":
            countryId = 2;
            break;

          case "GH":
            countryId = 3;
            break;

          case "TG":
            countryId = 4;
            break;

          case "BJ":
            countryId = 5;
            break;

          case "ML":
            countryId = 6;
            break;

          case "NE":
            countryId = 7;
            break;

          case "SN":
            countryId = 8;
            break;

          case "GN":
            countryId = 9;
            break;
        }

        if (!localStorage.getItem("country_id")) {
          localStorage.setItem("country_id", countryId.toString());
          window.dispatchEvent(new CustomEvent("country-changed"));
        }
      })
      .catch(console.error);
  }, []);

  return null;
};

export default CountryDetector;