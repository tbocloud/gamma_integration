# gamma_integration/gamma_integration/api.py

import frappe
import requests
import json

@frappe.whitelist()
def create_gamma_proposal(quotation_name, proposal_name, proposal_type="Main Proposal"):
    """Create a new Gamma proposal linked to quotation"""
    
    quotation = frappe.get_doc("Quotation", quotation_name)
    
    # Create Gamma Proposal document
    gamma_proposal = frappe.get_doc({
        "doctype": "Gamma Proposal",
        "proposal_name": proposal_name,
        "quotation": quotation_name,
        "proposal_type": proposal_type,
        "status": "Draft"
    })
    
    gamma_proposal.insert()
    
    # Add to quotation's gamma proposals table
    quotation.append("gamma_proposals", {
        "gamma_proposal": gamma_proposal.name,
        "proposal_type": proposal_type,
        "status": "Draft",
        "is_primary": len(quotation.gamma_proposals) == 0  # First one is primary
    })
    
    quotation.save()
    
    return {
        "status": "success",
        "gamma_proposal": gamma_proposal.name,
        "message": f"Gamma proposal '{proposal_name}' created successfully"
    }

@frappe.whitelist()
def sync_gamma_data(gamma_proposal_name, gamma_url):
    """Sync Gamma proposal data"""
    
    gamma_proposal = frappe.get_doc("Gamma Proposal", gamma_proposal_name)
    gamma_proposal.gamma_url = gamma_url
    gamma_proposal.save()
    
    return {
        "status": "success",
        "embed_id": gamma_proposal.gamma_embed_id
    }

@frappe.whitelist()
def get_quotation_proposals(quotation_name):
    """Get all Gamma proposals for a quotation"""
    
    proposals = frappe.get_all("Gamma Proposal",
                              filters={"quotation": quotation_name},
                              fields=["name", "proposal_name", "gamma_url", "status", "proposal_type"])
    
    return proposals