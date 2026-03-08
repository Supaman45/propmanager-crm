import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Map form data (camelCase) to database columns (snake_case)
const mapFormToDatabase = (formData) => {
  // Split applicantName into first_name and last_name
  const nameParts = (formData.applicantName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    user_id: formData.userId, // Will be set by the hook
    property_id: formData.propertyId || null,
    unit_number: formData.unitNumber || null,
    first_name: firstName,
    last_name: lastName,
    email: formData.applicantEmail || null,
    phone: formData.applicantPhone || null,
    date_of_birth: formData.dateOfBirth || null,
    ssn_last_four: formData.ssnLastFour || null,
    current_address: formData.currentAddress || null,
    current_city: formData.currentCity || null,
    current_state: formData.currentState || null,
    current_zip: formData.currentZip || null,
    current_rent: formData.currentRent || null,
    current_landlord_name: formData.currentLandlordName || null,
    current_landlord_phone: formData.currentLandlordPhone || null,
    months_at_current_address: formData.monthsAtCurrentAddress || null,
    employer_name: formData.employerName || null,
    employer_phone: formData.employerPhone || null,
    job_title: formData.jobTitle || null,
    monthly_income: formData.monthlyIncome || null,
    employment_start_date: formData.employmentStartDate || null,
    additional_income: formData.additionalIncome || null,
    additional_income_source: formData.additionalIncomeSource || null,
    has_eviction_history: formData.hasEvictionHistory || false,
    eviction_explanation: formData.evictionExplanation || null,
    has_criminal_history: formData.hasCriminalHistory || false,
    criminal_explanation: formData.criminalExplanation || null,
    has_bankruptcy: formData.hasBankruptcy || false,
    bankruptcy_explanation: formData.bankruptcyExplanation || null,
    desired_move_in: formData.desiredMoveIn || null,
    number_of_occupants: formData.numberOfOccupants || null,
    has_pets: formData.hasPets || false,
    pet_details: formData.petDetails || null,
    status: formData.status || 'draft',
    notes: formData.notes || null
  };
};

// Map database columns (snake_case) to form data (camelCase)
const mapDatabaseToForm = (dbData) => {
  if (!dbData) return null;
  
  return {
    propertyId: dbData.property_id,
    unitNumber: dbData.unit_number || '',
    applicantName: `${dbData.first_name || ''} ${dbData.last_name || ''}`.trim() || '',
    applicantEmail: dbData.email || '',
    applicantPhone: dbData.phone || '',
    dateOfBirth: dbData.date_of_birth || '',
    ssnLastFour: dbData.ssn_last_four || '',
    currentAddress: dbData.current_address || '',
    currentCity: dbData.current_city || '',
    currentState: dbData.current_state || '',
    currentZip: dbData.current_zip || '',
    currentRent: dbData.current_rent || '',
    currentLandlordName: dbData.current_landlord_name || '',
    currentLandlordPhone: dbData.current_landlord_phone || '',
    monthsAtCurrentAddress: dbData.months_at_current_address || '',
    employerName: dbData.employer_name || '',
    employerPhone: dbData.employer_phone || '',
    jobTitle: dbData.job_title || '',
    monthlyIncome: dbData.monthly_income || '',
    employmentStartDate: dbData.employment_start_date || '',
    additionalIncome: dbData.additional_income || '',
    additionalIncomeSource: dbData.additional_income_source || '',
    hasEvictionHistory: dbData.has_eviction_history || false,
    evictionExplanation: dbData.eviction_explanation || '',
    hasCriminalHistory: dbData.has_criminal_history || false,
    criminalExplanation: dbData.criminal_explanation || '',
    hasBankruptcy: dbData.has_bankruptcy || false,
    bankruptcyExplanation: dbData.bankruptcy_explanation || '',
    desiredMoveIn: dbData.desired_move_in || '',
    numberOfOccupants: dbData.number_of_occupants || '',
    hasPets: dbData.has_pets || false,
    petDetails: dbData.pet_details || '',
    status: dbData.status || 'draft',
    notes: dbData.notes || ''
  };
};

export const useApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all applications
  const getApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('tenant_applications')
        .select(`
          *,
          application_documents (
            id,
            application_id,
            document_type,
            file_url,
            file_name,
            uploaded_at
          ),
          screening_results (
            id,
            application_id,
            overall_score,
            risk_level,
            recommendation,
            income_analysis,
            rental_history_analysis,
            employment_verification,
            red_flags,
            summary,
            detailed_summary,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setApplications(data || []);
      return data || [];
    } catch (err) {
      setError(err.message);
      console.error('Error fetching applications:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch single application
  const getApplication = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('tenant_applications')
        .select(`
          *,
          application_documents (
            id,
            application_id,
            document_type,
            file_url,
            file_name,
            uploaded_at
          ),
          screening_results (
            id,
            application_id,
            overall_score,
            risk_level,
            recommendation,
            income_analysis,
            rental_history_analysis,
            employment_verification,
            red_flags,
            summary,
            detailed_summary,
            created_at
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      // Map database fields to form fields
      return mapDatabaseToForm(data) || data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching application:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create application
  const createApplication = async (applicationData) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Map form data to database columns
      const dbData = mapFormToDatabase({ ...applicationData, userId: user.id });

      const { data, error: createError } = await supabase
        .from('tenant_applications')
        .insert(dbData)
        .select()
        .single();

      if (createError) throw createError;
      await getApplications();
      // Return mapped data for consistency
      return mapDatabaseToForm(data) || data;
    } catch (err) {
      setError(err.message);
      console.error('Error creating application:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update application
  const updateApplication = async (id, applicationData) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('tenant_applications')
        .update({
          property_id: applicationData.property_id,
          unit_number: applicationData.unit_number,
          applicant_name: applicationData.applicant_name,
          applicant_email: applicationData.applicant_email,
          applicant_phone: applicationData.applicant_phone,
          date_of_birth: applicationData.date_of_birth,
          ssn_last_four: applicationData.ssn_last_four,
          current_address: applicationData.current_address,
          current_rent: applicationData.current_rent,
          landlord_name: applicationData.landlord_name,
          landlord_phone: applicationData.landlord_phone,
          landlord_email: applicationData.landlord_email,
          months_at_address: applicationData.months_at_address,
          employer_name: applicationData.employer_name,
          job_title: applicationData.job_title,
          monthly_income: applicationData.monthly_income,
          employment_start_date: applicationData.employment_start_date,
          has_eviction_history: applicationData.has_eviction_history,
          eviction_explanation: applicationData.eviction_explanation,
          has_criminal_history: applicationData.has_criminal_history,
          criminal_explanation: applicationData.criminal_explanation,
          has_bankruptcy: applicationData.has_bankruptcy,
          bankruptcy_explanation: applicationData.bankruptcy_explanation,
          desired_move_in_date: applicationData.desired_move_in_date,
          number_of_occupants: applicationData.number_of_occupants,
          has_pets: applicationData.has_pets,
          pet_details: applicationData.pet_details,
          status: applicationData.status,
          notes: applicationData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      await getApplications();
    } catch (err) {
      setError(err.message);
      console.error('Error updating application:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete application
  const deleteApplication = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete related records first
      await supabase
        .from('application_documents')
        .delete()
        .eq('application_id', id);

      await supabase
        .from('screening_results')
        .delete()
        .eq('application_id', id);

      await supabase
        .from('rental_references')
        .delete()
        .eq('application_id', id);

      // Delete application
      const { error: deleteError } = await supabase
        .from('tenant_applications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      await getApplications();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting application:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Upload document
  const uploadDocument = async (file, applicationId, documentType) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${applicationId}/${documentType}/${Date.now()}.${fileExt}`;
      const filePath = `application-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('application-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('application-documents')
        .getPublicUrl(filePath);

      // Save document record
      const { data, error: insertError } = await supabase
        .from('application_documents')
        .insert({
          application_id: applicationId,
          document_type: documentType,
          file_url: publicUrl,
          file_name: file.name
        })
        .select()
        .single();

      if (insertError) throw insertError;
      await getApplications();
      return data;
    } catch (err) {
      console.error('Error uploading document:', err);
      throw err;
    }
  };

  // Delete document
  const deleteDocument = async (documentId, fileUrl) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes('application-documents'));
      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        await supabase.storage
          .from('application-documents')
          .remove([filePath]);
      }

      // Delete document record
      const { error: deleteError } = await supabase
        .from('application_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;
      await getApplications();
    } catch (err) {
      console.error('Error deleting document:', err);
      throw err;
    }
  };

  // Get documents for application
  const getDocuments = async (applicationId) => {
    try {
      const { data, error } = await supabase
        .from('application_documents')
        .select('*')
        .eq('application_id', applicationId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching documents:', err);
      throw err;
    }
  };

  // Get screening results
  const getScreeningResults = async (applicationId) => {
    try {
      const { data, error } = await supabase
        .from('screening_results')
        .select('*')
        .eq('application_id', applicationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (err) {
      console.error('Error fetching screening results:', err);
      throw err;
    }
  };

  // Save screening results
  const saveScreeningResults = async (applicationId, results) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if results already exist
      const existing = await getScreeningResults(applicationId);

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('screening_results')
          .update({
            overall_score: results.overall_score,
            risk_level: results.risk_level,
            recommendation: results.recommendation,
            income_analysis: results.income_analysis,
            rental_history_analysis: results.rental_history_analysis,
            employment_verification: results.employment_verification,
            red_flags: results.red_flags,
            summary: results.summary,
            detailed_summary: results.detailed_summary,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('screening_results')
          .insert({
            application_id: applicationId,
            overall_score: results.overall_score,
            risk_level: results.risk_level,
            recommendation: results.recommendation,
            income_analysis: results.income_analysis,
            rental_history_analysis: results.rental_history_analysis,
            employment_verification: results.employment_verification,
            red_flags: results.red_flags,
            summary: results.summary,
            detailed_summary: results.detailed_summary
          });

        if (insertError) throw insertError;
      }

      await getApplications();
    } catch (err) {
      console.error('Error saving screening results:', err);
      throw err;
    }
  };

  useEffect(() => {
    getApplications();
  }, []);

  return {
    applications,
    loading,
    error,
    getApplications,
    getApplication,
    createApplication,
    updateApplication,
    deleteApplication,
    uploadDocument,
    deleteDocument,
    getDocuments,
    getScreeningResults,
    saveScreeningResults
  };
};
