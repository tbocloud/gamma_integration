# gamma_integration/gamma_integration/api.py

import frappe
from frappe import _
import requests
import json

@frappe.whitelist()
def create_gamma_proposal(quotation_name, proposal_name, proposal_type="Main Proposal"):
    """Create a new Gamma proposal linked to quotation"""
    try:
        # Check if quotation exists
        if not frappe.db.exists("Quotation", quotation_name):
            frappe.throw(f"Quotation {quotation_name} not found")
        
        quotation = frappe.get_doc("Quotation", quotation_name)
        
        # Create Gamma Proposal document
        gamma_proposal = frappe.get_doc({
            "doctype": "Gamma Proposal",
            "proposal_name": proposal_name,
            "quotation": quotation_name,
            "proposal_type": proposal_type,
            "status": "Draft",
            "gamma_url": f"https://gamma.app/docs/new-{frappe.generate_hash(length=8)}"
        })
        
        gamma_proposal.insert()
        
        # Add to quotation's gamma proposals table if the field exists
        try:
            # Check if the custom field exists before trying to use it
            if frappe.db.has_column("Quotation", "gamma_proposals"):
                # Map proposal types to child table format
                type_mapping = {
                    "Main Proposal": "Main",
                    "Technical Proposal": "Technical",
                    "Financial Proposal": "Financial",
                    "Executive Summary": "Executive",
                    "Product Demo": "Product Demo",
                    "Case Study": "Case Study"
                }
                mapped_type = type_mapping.get(proposal_type, "Main")
                
                quotation.append("gamma_proposals", {
                    "gamma_proposal": gamma_proposal.name,
                    "proposal_type": mapped_type,
                    "status": "Draft",
                    "is_primary": len(quotation.get("gamma_proposals", [])) == 0
                })
                quotation.save()
        except Exception as e:
            # Log but don't fail - the proposal is still created
            frappe.log_error(f"Could not link to quotation table: {str(e)}")
        
        return {
            "status": "success",
            "gamma_proposal": gamma_proposal.name,
            "message": f"Gamma proposal '{proposal_name}' created successfully"
        }
        
    except Exception as e:
        frappe.log_error(f"Error in create_gamma_proposal: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def sync_gamma_data(gamma_proposal_name, gamma_url):
    """Sync Gamma proposal data"""
    try:
        gamma_proposal = frappe.get_doc("Gamma Proposal", gamma_proposal_name)
        gamma_proposal.gamma_url = gamma_url
        gamma_proposal.last_updated = frappe.utils.now()
        gamma_proposal.save()
        
        return {
            "status": "success",
            "embed_id": gamma_proposal.gamma_embed_id,
            "message": "Gamma data synced successfully"
        }
        
    except Exception as e:
        frappe.log_error(f"Error in sync_gamma_data: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def get_quotation_proposals(quotation_name):
    """Get all Gamma proposals for a quotation"""
    try:
        proposals = frappe.get_all("Gamma Proposal",
                                  filters={"quotation": quotation_name},
                                  fields=["name", "proposal_name", "gamma_url", "gamma_embed_id", "status", "proposal_type", "last_updated"])
        
        return {
            "status": "success",
            "proposals": proposals
        }
        
    except Exception as e:
        frappe.log_error(f"Error in get_quotation_proposals: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "proposals": []
        }

@frappe.whitelist()
def test_connection():
    """Test API connection - useful for debugging"""
    try:
        return {
            "status": "success",
            "message": "Gamma Integration API is working correctly!",
            "timestamp": frappe.utils.now(),
            "user": frappe.session.user
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def link_existing_proposals():
    """Link existing Gamma Proposals to their quotations via child table"""
    try:
        # Get all Gamma Proposals that have quotations but might not be linked via child table
        proposals = frappe.get_all("Gamma Proposal",
                                 filters={"quotation": ["!=", ""]},
                                 fields=["name", "quotation", "proposal_type", "status", "proposal_name"])
        
        linked_count = 0
        
        # Map proposal types to child table format
        type_mapping = {
            "Main Proposal": "Main",
            "Technical Proposal": "Technical",
            "Financial Proposal": "Financial",
            "Executive Summary": "Executive",
            "Product Demo": "Product Demo",
            "Case Study": "Case Study"
        }
        
        for proposal in proposals:
            quotation_name = proposal.quotation
            
            # Get the quotation document
            if frappe.db.exists("Quotation", quotation_name):
                quotation = frappe.get_doc("Quotation", quotation_name)
                
                # Check if this proposal is already linked in the child table
                existing_link = None
                if quotation.get("gamma_proposals"):
                    for child in quotation.gamma_proposals:
                        if child.gamma_proposal == proposal.name:
                            existing_link = child
                            break
                
                # If not linked, add it to the child table
                if not existing_link:
                    # Map the proposal type correctly
                    mapped_type = type_mapping.get(proposal.proposal_type, "Main")
                    
                    quotation.append("gamma_proposals", {
                        "gamma_proposal": proposal.name,
                        "proposal_type": mapped_type,
                        "status": proposal.status or "Draft",
                        "is_primary": len(quotation.get("gamma_proposals", [])) == 0
                    })
                    
                    # Allow updating submitted documents
                    quotation.flags.ignore_validate_update_after_submit = True
                    quotation.save()
                    linked_count += 1
        
        return {
            "status": "success",
            "message": f"Successfully linked {linked_count} proposals to their quotations",
            "linked_count": linked_count
        }
        
    except Exception as e:
        frappe.log_error(f"Error in link_existing_proposals: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def auto_link_proposal_to_quotation(proposal_name):
    """Auto-link a specific proposal to its quotation"""
    try:
        if not frappe.db.exists("Gamma Proposal", proposal_name):
            return {"status": "error", "message": "Proposal not found"}
        
        proposal = frappe.get_doc("Gamma Proposal", proposal_name)
        proposal.link_to_quotation()
        
        return {
            "status": "success",
            "message": f"Proposal {proposal_name} linked successfully"
        }
        
    except Exception as e:
        frappe.log_error(f"Error in auto_link_proposal_to_quotation: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def refresh_quotation_gamma_display(quotation_name):
    """Refresh the Gamma proposals display for a quotation"""
    try:
        # First, ensure all existing proposals are linked
        proposals = frappe.get_all("Gamma Proposal",
                                 filters={"quotation": quotation_name},
                                 fields=["name"])
        
        for proposal in proposals:
            proposal_doc = frappe.get_doc("Gamma Proposal", proposal.name)
            proposal_doc.link_to_quotation()
        
        # Get updated proposals data
        return get_quotation_proposals(quotation_name)
        
    except Exception as e:
        frappe.log_error(f"Error in refresh_quotation_gamma_display: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "proposals": []
        }

@frappe.whitelist()
def unlink_gamma_proposal(proposal_name, link_name):
    """Unlink a Gamma proposal from quotation with proper permission handling"""
    try:
        # Validate inputs
        if not proposal_name or not link_name:
            return {
                "status": "error",
                "message": "Invalid proposal or link information"
            }
        
        # Check if the link record exists
        if not frappe.db.exists("Quotation Gamma Proposal", link_name):
            return {
                "status": "error",
                "message": "Link record not found"
            }
        
        # Get the link record to find the quotation
        link_doc = frappe.get_doc("Quotation Gamma Proposal", link_name)
        quotation_name = link_doc.parent
        
        # Get the quotation document
        if not frappe.db.exists("Quotation", quotation_name):
            return {
                "status": "error",
                "message": "Quotation not found"
            }
        
        quotation = frappe.get_doc("Quotation", quotation_name)
        
        # Find and remove the specific child record
        for i, child in enumerate(quotation.gamma_proposals):
            if child.name == link_name:
                quotation.gamma_proposals.pop(i)
                break
        
        # Set flags to allow updating submitted documents
        quotation.flags.ignore_validate_update_after_submit = True
        quotation.flags.ignore_permissions = True
        quotation.save()
        
        return {
            "status": "success",
            "message": f"Gamma proposal '{proposal_name}' unlinked successfully"
        }
        
    except Exception as e:
        frappe.log_error(f"Error in unlink_gamma_proposal: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }