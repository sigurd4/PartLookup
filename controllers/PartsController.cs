using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using PartLookup.Data;
using PartLookup.Data.Models;

namespace PartLookup.Controllers
{
    [Route("api/[controller]")]
    public class PartsController : Controller
    {
        private string fileName {get {return "parts";}}
        public PartsController()
        {
            
        }

        [HttpGet("{query}")]
        public string GetWithQuery(string query)
        {
            string json = "";
            using(DataHandler dh = new DataHandler(this.fileName))
            {
                try
                {
                    DataFilter df = JsonConvert.DeserializeObject<DataFilter>(query);
                    dh.read();

                    string[][] fes = dh.filter(df);
                    json = JsonConvert.SerializeObject(fes);
                }
                catch {}
            }
            return json;
        }
    }
}
