# gamma_integration/gamma_integration/doctype/gamma_proposal/gamma_proposal.py

import frappe
from frappe.model.document import Document
import requests
import json
from urllib.parse import urlparse

class GammaProposal(Document):
    def validate(self):
        self.extract_gamma_embed_id()
        self.update_last_updated()
    
    def extract_gamma_embed_id(self):
        """Extract embed ID from Gamma URL"""
        if self.gamma_url:
            # Handle different Gamma URL formats
            if '/embed/' in self.gamma_url:
                self.gamma_embed_id = self.gamma_url.split('/embed/')[-1].split('?')[0]
            elif '/docs/' in self.gamma_url:
                doc_id = self.gamma_url.split('/docs/')[-1].split('?')[0]
                self.gamma_embed_id = doc_id
                self.gamma_url = f"https://gamma.app/embed/{doc_id}"
            elif '/public/' in self.gamma_url:
                doc_id = self.gamma_url.split('/public/')[-1].split('?')[0]
                self.gamma_embed_id = doc_id
                self.gamma_url = f"https://gamma.app/embed/{doc_id}"
    
    def update_last_updated(self):
        """Update last updated timestamp"""
        self.last_updated = frappe.utils.now()
    
    def get_embed_html(self, height="600px"):
        """Generate embed HTML for the proposal"""
        if not self.gamma_embed_id:
            return ""
        
        embed_html = f"""
        <div class="gamma-proposal-embed" data-proposal-id="{self.name}">
            <div class="gamma-proposal-header">
                <div class="proposal-info">
                    <h5>{self.proposal_name}</h5>
                    <span class="badge badge-{self.get_status_color()}">{self.status}</span>
                </div>
                <div class="proposal-actions">
                    <a href="https://gamma.app/docs/{self.gamma_embed_id}" target="_blank" class="btn btn-sm btn-secondary">
                        ✏️ Edit
                    </a>
                    <a href="https://gamma.app/public/{self.gamma_embed_id}" target="_blank" class="btn btn-sm btn-primary">
                        🔗 Share
                    </a>
                </div>
            </div>
            <iframe 
                src="https://gamma.app/embed/{self.gamma_embed_id}" 
                style="width: 100%; height: {height}; border: none; border-radius: 6px;" 
                allowfullscreen 
                title="{self.proposal_name}">
            </iframe>
        </div>
        """
        return embed_html
    
    def get_status_color(self):
        """Get bootstrap color class for status"""
        color_map = {
            'Draft': 'secondary',
            'In Review': 'warning',
            'Shared': 'info',
            'Approved': 'success',
            'Rejected': 'danger'
        }
        return color_map.get(self.status, 'light')

@frappe.whitelist()
def sync_quotation_data(doc, method):
    """Sync quotation data to associated Gamma proposals"""
    gamma_proposals = frappe.get_all("Gamma Proposal", 
                                   filters={"quotation": doc.name}, 
                                   fields=["name"])
    
    for proposal in gamma_proposals:
        # Update proposal data if needed
        proposal_doc = frappe.get_doc("Gamma Proposal", proposal.name)
        proposal_doc.last_updated = frappe.utils.now()
        proposal_doc.save()