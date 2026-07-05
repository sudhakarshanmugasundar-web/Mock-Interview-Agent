package com.mockinterview.service.resume;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Component
public class ResumeTextExtractor {

    public String extractText(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("Invalid file name");
        }
        
        String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        try (InputStream is = file.getInputStream()) {
            if (ext.equals(".pdf")) {
                return extractFromPdf(is);
            } else if (ext.equals(".docx")) {
                return extractFromDocx(is);
            } else {
                throw new IllegalArgumentException("Unsupported file type: " + ext);
            }
        }
    }

    private String extractFromPdf(InputStream is) throws IOException {
        byte[] bytes = is.readAllBytes();
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractFromDocx(InputStream is) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(is)) {
            try (XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
                return extractor.getText();
            }
        }
    }
}
