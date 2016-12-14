using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web.Mvc;
using MvcPccViewerSamples.Models.Pcc;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace MvcPccViewerSamples.Controllers
{
    public class FullViewerController : Controller
    {
        private static readonly string Root = System.Web.HttpContext.Current.Server.MapPath(".");
        private static readonly string ViewerAssetsPath = @"viewers\full-viewer-sample\viewer-assets\";
        private readonly string _languageConfigPath = Path.Combine(Root, ViewerAssetsPath, @"languages\en-US.json");
        private readonly string _searchConfigPath = Path.Combine(Root, @"viewers\full-viewer-sample\predefinedsearch.json");
        private readonly string _redactionReasonsConfigPath = Path.Combine(Root, @"viewers\full-viewer-sample\redactionReason.json");
        private readonly string _templateFolderPath = Path.Combine(Root, ViewerAssetsPath, "templates");

        public ActionResult Index()
        {
            // Create a ViewingSession based on the document defined in the query parameter
            // Example: ?document=sample.doc
            var viewingSessionId = Request.QueryString["viewingSessionId"];

            var documentQueryParameter = Request.QueryString["document"];
            ViewBag.OriginalDocumentName = documentQueryParameter;

            if (string.IsNullOrEmpty(viewingSessionId))
            {
                ViewBag.ViewingSessionId = PrizmApplicationServices.CreateSessionFromDocument(documentQueryParameter);
            }
            else
            {
                ViewBag.ViewingSessionId = viewingSessionId;
            }

            ViewBag.TemplateJson = GetTemplatesJson(_templateFolderPath);
            ViewBag.SearchJson = GetConfigFileJson(_searchConfigPath);
            ViewBag.LanguageJson = GetConfigFileJson(_languageConfigPath);
            ViewBag.RedactionReasonJson = GetConfigFileJson(_redactionReasonsConfigPath);

            return View();
        }

        private static IEnumerable<string> GetFiles(string sourceFolder, string filters, SearchOption searchOption)
        {
            return
                filters.Split('|')
                    .SelectMany(filter => Directory.GetFiles(sourceFolder, filter, searchOption))
                    .ToArray();
        }

        private static string GetTemplatesJson(string templateDirectoryPath)
        {
            var templatesDictionary = new Dictionary<string, string>();

            //Location where template files are stored
            var templateList = GetFiles(templateDirectoryPath, "*Template.html", SearchOption.TopDirectoryOnly);

            foreach (var templatePath in templateList.Where(template => System.IO.File.Exists(template)))
            {
                var template = System.IO.File.ReadAllText(templatePath);
                template = template.Replace('\r', ' ').Replace('\n', ' ').Replace('\t', ' ');
                var regex = new Regex("Template.html", RegexOptions.IgnoreCase);
                var fileName = regex.Replace(templatePath, "");
                templatesDictionary.Add(Path.GetFileName(fileName), template);
            }
            //stringify JSON object
            return ToCamelCasedJson(templatesDictionary);
        }

        private static string GetConfigFileJson(string filePath)
        {
            if (!System.IO.File.Exists(filePath)) return "undefined";
            var json = System.IO.File.ReadAllText(filePath);
            return string.IsNullOrEmpty(json) ? "undefined" :
                JsonConvert.SerializeObject(JsonConvert.DeserializeObject(json));
        }

        private static string ToCamelCasedJson(object obj)
        {
            return JsonConvert.SerializeObject(obj, new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver(),
                StringEscapeHandling = StringEscapeHandling.EscapeHtml
            });
        }
    }
}