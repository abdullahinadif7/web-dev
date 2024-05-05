import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = 3000;
const API_KEY = process.env.API_KEY;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res)=>{
    res.render("index.ejs");
});

app.post("/submit", async (req, res)=>{
    //we parse the request body, specially value that the "city" property has, to use it
    //to pass as query parameter when sending get request to obtain latitude and longitude
    //from api
    const cityName = req.body.city;

    try{
        //sending get request to openweathermap api to get latitude and longitude of 
        //the city searched by the user, so we can pass those as query parameters
        //to the second request, to tell the api latitude and longitude of that place
        const response = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&appid=${API_KEY}`);
        const lat = response.data[0].lat;
        const long = response.data[0].lon; 

        //sending request to openweathermap api and passing latitude and longitude obtained
        //from the previous response as well as the api key as query parameters
        const response2 = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${API_KEY}`);
        console.log(response2.data);

        //converting the datetime properts' value which is unix timestamp in seconds to 
        //milliseconds so we can pass in when initializing javaScript Date class 
        const timeStampInMilliSeconds = response2.data.dt * 1000;
        

        const sunriseDate = new Date(response2.data.sys.sunrise * 1000);
        const sunriseTime = new Date(sunriseDate.getTime() + response2.data.timezone*1000);
        const sunrise = sunriseTime.toISOString().split("T")[1].split(".")[0];
        
        //_____________________________________________________________
        //initializing sunsetDate object from Date class, passing in the unix timestamp value given by the 
        //response that is representing the sunset of the requested city as an argument and 
        //storing it in the sunsetDate constant, we then initialize sunsetTime object again from the Date class
        //and pass in the sunsetDate.getTime() method to get the actual time, and then add that by  
        //the timezone of the location in milliseconds and we did that by multiplying 1000
        //by the timezone obtained from the response which was unix timestamps initially,
        //and then store it in sunsetTime constant.
        //we finally split the result we get which contains the date and the time to get
        //hold of the time, because we don't need the date for now, and we store that in 
        //the sunset constant
        const sunsetDate = new Date(response2.data.sys.sunset * 1000);
        const sunsetTime = new Date(sunsetDate.getTime() + response2.data.timezone*1000);
        const sunset = sunsetTime.toISOString().split("T")[1].split(".")[0];
        

        //_______________________________________________________________
        //Current time
        //initializing dateObj object from Date class, and then in the next line we multiply
        //timezone obtained from the response, which is unixtimestamp seconds by 1000 to
        //convert it to milliseconds to make it easy to work with.
        //We then initialize yet another date object "newDateTime" to create an object that
        //holds real current time of the location, by uitilizing the dateObj by calling the
        //getTime() method to it to get the time from it, anad then we add that by the 
        //timezone we had, to match the current time in the location requested
        const dateObj = new Date();
        const timezoneOffsetInMs = 1000 * response2.data.timezone ;
        const newDateTime = new Date(dateObj.getTime() + timezoneOffsetInMs);
        const currentTime = newDateTime.toISOString().split("T")[1].split(".")[0];


        //_________________________________________________________________
        //Generating background image based on whether it is day or night and the 
        //condition

        const sunriseHour = parseInt(sunrise.split(":")[0]);

        const sunsetHour = parseInt(sunset.split(":")[0]);
        
        const currentHour = parseInt(currentTime.split(":")[0]);

        const backgroundImage = currentHour >= sunriseHour && currentHour < sunsetHour ? `${response2.data.weather[0].description}_day.png` : `${response2.data.weather[0].description}_night.png`;

        //_________________________________________________________________
        
        const date = new Date(timeStampInMilliSeconds);
        
        const currentDate = `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()} ${date.getFullYear()}`;
        const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        const currentDay = weekDays[date.getDay()];

        //converting weather temperature obtained from the response in kelvin to celsius,
        //and storing it in the celsiusDeg constant, we then create another constant that 
        //is meant to hold the temp in fehrenheit to render, we did that by converting the 
        //celsius we had in the celsiusDeg constant to fehrenheit, and storing it in constant
        //called fehrenheitDeg
        const celsiusDeg = Math.round(response2.data.main.temp - 273.15); 
        const fehrenheitDeg = `${Math.round((celsiusDeg*9/5) + 32)}\u00B0F`;  
        
        //Now, that we got all the data we needed to pass to the template, we structure
        //an object that holds that data, which can pass to the ejs tamplate
        const weatherData = {
            location: response2.data.name,
            dateTime: currentDate,
            weekDay: currentDay,
            celsiusDeg: `${celsiusDeg}\u00B0C`,
            fehrenheitDeg: fehrenheitDeg,
            weatherCondition: response2.data.weather[0].description,
            humidity: response2.data.main.humidity,
            windSpeed: `${response2.data.wind.speed} m/s`,
            icon: `http://openweathermap.org/img/wn/${response2.data.weather[0].icon}.png`,
            currentTime: currentTime,
            backgroundImage: backgroundImage
        };
        
        //passing the object containing the data we need to render to the ejs template, which 
        //is the weatherData object under property we call content, we didn't pass the weatherData
        //directly to the ejs template, because then it will be hard to change the value
        //it holds when for example an error occurs(e.g when user searches for city that 
        //does not exist ) since weatherData is constant. But now we can change the value
        //of the content constant as we like, as you will see later in the catch block below
        res.render("index.ejs", {content: weatherData});

       
    }catch(error){
        //we log the error in the console if there is one
        console.error(error);
        //we change render string that tells the user that the city they requested could not
        //be found if for example the latitude or longitude or both could not be found
        res.render("index.ejs", {content: "The city name you provided couldn't be found!"})
    }
});


app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);

});