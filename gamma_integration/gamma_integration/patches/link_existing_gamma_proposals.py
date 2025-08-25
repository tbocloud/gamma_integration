import frappe

def execute():
    """Link existing Gamma Proposals to their quotations via child table"""
    try:
        # Get all Gamma Proposals that have quotations
        proposals = frappe.get_all("Gamma Proposal",
                                 filters={"quotation": ["!=", ""]},
                                 fields=["name", "quotation", "proposal_type", "status"])
        
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
            
            # Check if quotation exists
            if not frappe.db.exists("Quotation", quotation_name):
                continue
                
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
                quotation.flags.ignore_permissions = True
                quotation.save()
                linked_count += 1
        
        if linked_count > 0:
            frappe.db.commit()
            print(f"Successfully linked {linked_count} Gamma proposals to their quotations")
        else:
            print("No proposals needed linking")
            
    except Exception as e:
        frappe.log_error(f"Error in link_existing_gamma_proposals patch: {str(e)}")
        print(f"Error: {str(e)}")