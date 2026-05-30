use serde::{Deserialize, Serialize};
use std::error::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportFormat {
    CSV,
    JSON,
    PDF,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportData {
    pub id: String,
    pub waste_type: String,
    pub weight: u128,
    pub status: String,
    pub created_at: String,
}

pub struct ExportService;

impl ExportService {
    pub fn export_to_csv(data: Vec<ExportData>) -> Result<String, Box<dyn Error>> {
        let mut csv_content = String::from("ID,Waste Type,Weight,Status,Created At\n");
        
        for item in data {
            csv_content.push_str(&format!(
                "{},{},{},{},{}\n",
                item.id, item.waste_type, item.weight, item.status, item.created_at
            ));
        }
        
        Ok(csv_content)
    }

    pub fn export_to_json(data: Vec<ExportData>) -> Result<String, Box<dyn Error>> {
        let json = serde_json::to_string_pretty(&data)?;
        Ok(json)
    }

    pub fn export_to_pdf(data: Vec<ExportData>) -> Result<Vec<u8>, Box<dyn Error>> {
        // Basic PDF generation using printpdf
        use printpdf::*;
        use std::fs::File;
        use std::io::BufWriter;

        let (document, page1, layer1) = PdfDocument::new("Scavenger Export", Mm(210.0), Mm(297.0), "Layer 1");
        let font = document.add_builtin_font(BuiltinFont::Helvetica)?;
        let current_layer = document.get_page(page1).get_layer(layer1);

        let mut y_pos = 280.0;
        current_layer.use_text("Scavenger Data Export", 24.0, Mm(10.0), Mm(y_pos), &font);
        y_pos -= 10.0;

        for item in data {
            let text = format!(
                "ID: {} | Type: {} | Weight: {} | Status: {}",
                item.id, item.waste_type, item.weight, item.status
            );
            current_layer.use_text(&text, 10.0, Mm(10.0), Mm(y_pos), &font);
            y_pos -= 5.0;

            if y_pos < 10.0 {
                break;
            }
        }

        let mut buffer = Vec::new();
        document.save(&mut BufWriter::new(&mut buffer))?;
        Ok(buffer)
    }

    pub fn export(format: ExportFormat, data: Vec<ExportData>) -> Result<Vec<u8>, Box<dyn Error>> {
        match format {
            ExportFormat::CSV => {
                let csv = Self::export_to_csv(data)?;
                Ok(csv.into_bytes())
            }
            ExportFormat::JSON => {
                let json = Self::export_to_json(data)?;
                Ok(json.into_bytes())
            }
            ExportFormat::PDF => Self::export_to_pdf(data),
        }
    }
}
